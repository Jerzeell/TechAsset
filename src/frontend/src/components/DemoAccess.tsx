import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { demoUsers, leaveDemo, demoUser } from '../lib/demo';
import { roleLabel } from '../lib/models';
export default function DemoAccess(){
 const navigate=useNavigate();
 return <main className="demo-access"><section>
  <p className="eyebrow">TechAsset · Vista de demostración</p>
  <h1>Explora el sistema por rol</h1>
  <p>Selecciona una vista para conocer las pantallas. Los datos son ejemplos ficticios y las operaciones de guardado están deshabilitadas.</p>
  <div className="demo-role-grid">{demoUsers.map(u=><button className="btn btn-primary" key={u.rol} onClick={()=>{sessionStorage.setItem('techasset_demo_role',u.rol);navigate(u.rol==='Colaborador'?'/equipos':'/panel');}}>{roleLabel(u.rol)}</button>)}</div>
  <p>Esta selección no es un inicio de sesión. El acceso real, las contraseñas, los permisos del servidor y la persistencia se ejecutan en la instalación con .NET y PostgreSQL.</p>
  <Link className="btn btn-secondary" to="/">Volver al portal</Link>
 </section></main>;
}
export function DemoBanner(){
 const navigate=useNavigate();
 useEffect(()=>{const jump=(event:MouseEvent)=>{const anchor=(event.target as HTMLElement).closest('a');const href=anchor?.getAttribute('href');if(href?.startsWith('#')&&!href.startsWith('#/')){event.preventDefault();document.getElementById(href.slice(1))?.scrollIntoView({behavior:'smooth'});}};document.addEventListener('click',jump);return()=>document.removeEventListener('click',jump);},[]);
 return <aside className="demo-banner" aria-label="Alcance de la demostración">
  <span><strong>Demostración de solo lectura</strong> · Datos ficticios · Sin conexión a PostgreSQL</span>
  <div><a href="https://github.com/Jerzeell/TechAsset#readme">Documentación y código</a>{demoUser()&&<button onClick={()=>{leaveDemo();navigate('/login');}}>Cambiar rol</button>}</div>
 </aside>;
}
