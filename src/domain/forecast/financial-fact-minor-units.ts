/** Convert exact minor-unit ledger amounts to Prisma-compatible decimal strings. */
export function decimalFromMinorUnits(amountMinor:bigint,minorUnits:number):string{
 if(!Number.isInteger(minorUnits)||minorUnits<0||minorUnits>6)throw new Error('UNSUPPORTED_FINANCIAL_FACT_PRECISION');
 const negative=amountMinor<0n;
 const magnitude=negative?-amountMinor:amountMinor;
 const divisor=10n**BigInt(minorUnits);
 const whole=magnitude/divisor;
 const remainder=magnitude%divisor;
 const fraction=minorUnits?'.'+remainder.toString().padStart(minorUnits,'0'):'';
 return (negative?'-':'')+whole.toString()+fraction;
}
export function minorUnitsFromDecimal(amount:string,minorUnits:number):bigint{
 if(!Number.isInteger(minorUnits)||minorUnits<0||minorUnits>6)throw new Error('UNSUPPORTED_FINANCIAL_FACT_PRECISION');
 if(!/^-?\d+(\.\d+)?$/.test(amount))throw new Error('INVALID_FINANCIAL_FACT_AMOUNT');
 const negative=amount.startsWith('-');
 const [whole,fraction='']=amount.replace('-','').split('.');
 if(fraction.length>minorUnits&&/[1-9]/.test(fraction.slice(minorUnits)))throw new Error('FINANCIAL_FACT_PRECISION_LOSS');
 const units=BigInt(whole)*10n**BigInt(minorUnits)+BigInt((fraction.slice(0,minorUnits).padEnd(minorUnits,'0'))||'0');
 return negative?-units:units;
}
