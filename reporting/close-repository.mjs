import {createHash} from "node:crypto";
const hash=value=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
const clone=value=>JSON.parse(JSON.stringify(value));
export class CloseRepository {
 #records=new Map();#audit=[];#tail="GENESIS";
 constructor({storage}={}){
  if(storage&&(!storage.read||!storage.write||!storage.appendAudit)) throw new Error("Storage must implement read, write and appendAudit");
  this.storage=storage;
 }
 async save(record,{expectedStatus=null,actor}={}){
  if(!record?.entityId||!record?.period||!record?.status||!actor) throw new Error("Complete close record and actor required");
  const key=record.entityId+":"+record.period;
  const prior=this.storage?await this.storage.read(key):this.#records.get(key);
  if((prior?.status||null)!==expectedStatus) throw new Error("Optimistic concurrency conflict");
  if(prior?.status==="APPROVED") throw new Error("Approved close is immutable");
  const version=(prior?.version||0)+1;
  const next=clone({...record,version});
  const event={key,version,actor,status:next.status,recordHash:hash(next),previousHash:this.#tail};
  event.hash=hash(event);
  if(this.storage){
   // Adapter MUST atomically enforce expectedStatus/version and append audit with record.
   await this.storage.write(key,next,{expectedVersion:prior?.version||0,auditEvent:event});
  }else{
   this.#records.set(key,next);
   this.#audit.push(clone(event));
  }
  this.#tail=event.hash;
  return clone(next);
 }
 async get(entityId,period){const key=entityId+":"+period;const item=this.storage?await this.storage.read(key):this.#records.get(key);return item?clone(item):null}
 audit(){return clone(this.#audit)}
 verifyAudit(){let previous="GENESIS";for(const event of this.#audit){const {hash:actual,...body}=event;if(body.previousHash!==previous||hash(body)!==actual)return false;previous=actual}return true}
}
