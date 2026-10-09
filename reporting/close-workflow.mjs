import {createHash} from "node:crypto";
import {reviewClose} from "./close-review.mjs";
const digest=x=>createHash("sha256").update(JSON.stringify(x)).digest("hex");
export class CloseWorkflow {
 #records=new Map();#events=[];#lastHash="GENESIS";
 constructor({ledger,config,chart,authorize,save}){
  if(typeof authorize!=="function") throw new Error("Authentication and authorization adapter required");
  this.ledger=ledger;this.config=config;this.chart=chart;this.authorize=authorize;this.save=save;
 }
 #check(principal,role){if(!principal?.id||!this.authorize(principal,role,this.config.entityId)) throw new Error("Unauthorized "+role)}
 #event(kind,period,actor,data={}){
  const event={sequence:this.#events.length+1,kind,period,actor,previousHash:this.#lastHash,data};
  event.hash=digest(event);this.#lastHash=event.hash;this.#events.push(Object.freeze(event));
 }
 async submit({period,reconciliations,principal}){
  this.#check(principal,"controller");
  if(this.#records.has(period)) throw new Error("Close already submitted");
  const review=reviewClose({ledger:this.ledger,config:this.config,chart:this.chart,period,reconciliations});
  if(review.status!=="READY_FOR_HUMAN_APPROVAL") throw new Error("Close reconciliation blocked");
  const record={period,entityId:this.config.entityId,status:"PENDING_APPROVAL",submittedBy:principal.id,review,approvedBy:null};
  if(this.save) await this.save(record);
  this.#records.set(period,structuredClone(record));this.#event("SUBMITTED",period,principal.id,{reviewHash:digest(review)});
  return structuredClone(record);
 }
 async approve({period,principal}){
  this.#check(principal,"cfo");
  const previous=this.#records.get(period);
  if(!previous||previous.status!=="PENDING_APPROVAL") throw new Error("Close not pending");
  if(previous.submittedBy===principal.id) throw new Error("Segregation of duties violation");
  const current=reviewClose({ledger:this.ledger,config:this.config,chart:this.chart,period,reconciliations:previous.review.trialBalance.map(x=>({account:x.account,externalBalanceMinor:x.netMinor}))});
  if(current.status!=="READY_FOR_HUMAN_APPROVAL"||digest(current.trialBalance)!==digest(previous.review.trialBalance)) throw new Error("Ledger changed after submission");
  const next={...previous,status:"APPROVED",approvedBy:principal.id};
  if(this.save) await this.save(next);
  this.#records.set(period,structuredClone(next));this.#event("APPROVED",period,principal.id);
  return structuredClone(next);
 }
 getRecord(period,principal){this.#check(principal,"reader");const r=this.#records.get(period);return r?structuredClone(r):null}
 getAudit(principal){this.#check(principal,"auditor");return structuredClone(this.#events)}
 verifyAudit(){let prev="GENESIS";for(const e of this.#events){const {hash,...body}=e;if(body.previousHash!==prev||digest(body)!==hash)return false;prev=hash}return true}
}
