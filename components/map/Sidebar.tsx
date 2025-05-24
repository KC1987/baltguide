'use client'

export default function Sidebar({markers}:any) {


  return (
    <div className="w-1/3 h-screen" >
      {markers.map( (m, i) => <div className="border border-cyan-400 h-12 w-full" key={i} >{m.name}</div>)}
    </div>
  )
}