const GLYPHS = {
  '0': '01110,10001,10011,10101,11001,10001,01110',
  '1': '00100,01100,00100,00100,00100,00100,01110',
  '2': '01110,10001,00001,00010,00100,01000,11111',
  '3': '11110,00001,00001,01110,00001,00001,11110',
  '4': '00010,00110,01010,10010,11111,00010,00010',
  '5': '11111,10000,11110,00001,00001,10001,01110',
  '6': '00110,01000,10000,11110,10001,10001,01110',
  '7': '11111,00001,00010,00100,01000,01000,01000',
  '8': '01110,10001,10001,01110,10001,10001,01110',
  '9': '01110,10001,10001,01111,00001,00010,01100',
  ':': '0,0,1,0,1,0,0',
};

export function DotDigits({ text, pitch = 10 }) {
  let x = 0;
  const dots = [];
  [...text].forEach((ch, ci) => {
    const rows = GLYPHS[ch].split(',');
    rows.forEach((row, r) => [...row].forEach((v, c) => dots.push(
      <circle key={`${ci}-${r}-${c}`} cx={x + c * pitch + 5} cy={r * pitch + 5}
        r={v === '1' ? 3.8 : 1.6} className={v === '1' ? 'dot-on' : 'dot-off'} />
    )));
    x += (rows[0].length + 1) * pitch;
  });
  const w = x - pitch;
  return <svg viewBox={`0 0 ${w} 70`} width={w} height="70" role="img" aria-label={text}>{dots}</svg>;
}

export function DotRing({ progress }) {
  const total = 72, lit = Math.round(progress * total);
  const dots = Array.from({ length: total }, (_, i) => {
    const a = (i * 5 - 90) * Math.PI / 180;
    return <circle key={i} cx={190 + 170 * Math.cos(a)} cy={190 + 170 * Math.sin(a)}
      r={i < lit ? 6 : 2.6} className={i < lit ? 'ring-on' : 'ring-off'} />;
  });
  return <svg className="ring" viewBox="0 0 380 380" aria-hidden="true">{dots}</svg>;
}
