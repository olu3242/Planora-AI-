import {postJournal} from "./us-gaap-journals.mjs";
export class PeriodLedger {
 #journals=new Map();
 #periods=new Map();
 #events=[];
 constructor({config,chart}){this.config=config;this.chart=chart}
 setPeriod(period,status,actor){
  if(!/^\d{4}-\d{2}$/.test(period)||Number.isNaN(Date.parse(period+"-01"))) throw new Error("Invalid period");
  if(!["OPEN","CLOSED"].includes(status)) throw new Error("Invalid period status");
  if(typeof actor!=="string"||!actor.trim()) throw new Error("Actor required");
  const previous=this.#periods.get(period)||"OPEN";
  if(previous==="CLOSED"&&status==="OPEN") throw new Error("Reopen requires external approval workflow");
  this.#periods.set(period,status);
  this.#events.push(Object.freeze({kind:"PERIOD_STATUS",period,previous,status,actor}));
 }
 post(journal,actor){
  if(typeof actor!=="string"||!actor.trim()) throw new Error("Actor required");
  if(!journal||typeof journal.date!=="string") throw new Error("Journal date required");
  const period=journal.date.slice(0,7);
  if(this.#journals.has(journal.id)) throw new Error("Duplicate journal ID");
  const checked=postJournal({config:this.config,chart:this.chart,journal,periodStatus:this.#periods.get(period)||"OPEN"});
  const record=Object.freeze({...checked,status:"POSTED",actor});
  this.#journals.set(checked.id,record);
  this.#events.push(Object.freeze({kind:"JOURNAL_POSTED",id:checked.id,period,actor}));
  return record;
 }
 reverse(id,{id:reversalId,date,actor}){
  const original=this.#journals.get(id);
  if(!original) throw new Error("Original journal missing");
  if(typeof reversalId!=="string"||!reversalId.trim()||reversalId===id) throw new Error("Invalid reversal ID");
  return this.post({id:reversalId,entityId:original.entityId,date,lines:original.lines.map(l=>({account:l.account,debitMinor:l.creditMinor,creditMinor:l.debitMinor}))},actor);
 }
 getJournals(){return [...this.#journals.values()].map(j=>({...j,lines:j.lines.map(l=>({...l}))}))}
 getEvents(){return this.#events.map(e=>({...e}))}
 getPeriod(period){return this.#periods.get(period)||"OPEN"}
}
