export default function Loading() {
  return (
    <div style={{ padding:'32px', fontFamily:"'Noto Sans JP',sans-serif", display:'flex', flexDirection:'column', gap:'14px' }}>
      <div style={{ height:'26px', width:'180px', background:'#e8f0ea', borderRadius:'6px' }}/>
      <div style={{ height:'4px', width:'100%', background:'#e8f0ea', borderRadius:'10px', overflow:'hidden' }}>
        <div style={{ height:'100%', background:'linear-gradient(90deg,#2d6a4f,#52b788,#2d6a4f)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite', borderRadius:'10px' }}/>
      </div>
      {[140,200,160,180].map((w,i)=>(
        <div key={i} style={{ height:'60px', width:'100%', background:'#f0f7f1', borderRadius:'10px', border:'1px solid #e2ece5' }}/>
      ))}
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  )
}
