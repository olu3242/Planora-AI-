export function bankMappingWindowsOverlap(a:{from:Date;to:Date|null},b:{from:Date;to:Date|null}):boolean {
 if(!Number.isFinite(a.from.getTime())||!Number.isFinite(b.from.getTime()))return false;
 if(a.to && (!Number.isFinite(a.to.getTime())||a.to<a.from))return false;
 if(b.to && (!Number.isFinite(b.to.getTime())||b.to<b.from))return false;
 return (!a.to||b.from<=a.to)&&(!b.to||a.from<=b.to);
}
