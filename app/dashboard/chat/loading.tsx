export default function ChatLoading() {
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', fontFamily:"'Noto Sans JP',sans-serif" }}>
      <div style={{ padding:'16px 20px 0', background:'#fff', borderBottom:'1px solid #e2ece5' }}>
        <div style={{ height:'18px', width:'130px', background:'#e8f0ea', borderRadius:'5px', marginBottom:'14px' }}/>
        <div style={{ display:'flex', gap:'4px' }}>
          {[80,90,100,120].map((w,i)=>(
            <div key={i} style={{ height:'32px', width:`${w}px`, background:'#f0f7f1', borderRadius:'6px 6px 0 0' }}/>
          ))}
        </div>
      </div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', color:'#9aab9f', fontSize:'13px' }}>
          <div style={{ width:'40px', height:'40px', borderRadius:'50%', border:'3px solid #e2ece5', borderTopColor:'#2d6a4f', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
          読み込み中...
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
