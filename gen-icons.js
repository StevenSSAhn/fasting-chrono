const zlib = require("zlib"), fs = require("fs");

function crc32(buf){
  let c, t = [];
  for(let n=0;n<256;n++){ c=n; for(let k=0;k<8;k++) c = c&1 ? 0xEDB88320^(c>>>1) : c>>>1; t[n]=c>>>0; }
  let crc = 0xFFFFFFFF;
  for(const b of buf) crc = t[(crc^b)&0xFF] ^ (crc>>>8);
  return (crc^0xFFFFFFFF)>>>0;
}
function chunk(type, data){
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type,"ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgb){
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w,0); ihdr.writeUInt32BE(h,4);
  ihdr[8]=8; ihdr[9]=2; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  const raw = Buffer.alloc(h*(1+w*3));
  for(let y=0;y<h;y++){
    const off = y*(1+w*3);
    raw[off] = 0;
    for(let x=0;x<w;x++){
      const c = rgb(x,y), p = off+1+x*3;
      raw[p]=c[0]; raw[p+1]=c[1]; raw[p+2]=c[2];
    }
  }
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, {level:9})),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

const NAVY=[0x11,0x18,0x20], TEAL=[0x4F,0xA8,0x94], DARK=[0x1E,0x3B,0x38], EMBER=[0xDB,0x83,0x40];

// the app's 24h instrument band, reduced to an icon:
// bright teal = elapsed, dark teal = fast remaining, ember = eating window
function draw(N){
  const x0=0.14*N, x1=0.86*N, yTop=0.42*N, yBot=0.58*N;
  const span=x1-x0, mElapsed=x0+span*0.47, mGoal=x0+span*0.75;
  return (x,y)=>{
    if(y<yTop || y>=yBot || x<x0 || x>=x1) return NAVY;
    if(x < mElapsed) return TEAL;
    if(x < mGoal)    return DARK;
    return EMBER;
  };
}

[180,192,512].forEach(n=>{
  fs.writeFileSync(require("path").join(__dirname, `icon-${n}.png`), png(n,n,draw(n)));
  console.log("icon-"+n+".png");
});
