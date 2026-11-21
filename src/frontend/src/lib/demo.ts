import type { AxiosAdapter } from 'axios';
import { AxiosError } from 'axios';
import type { User, Equipment, Loan, LoanRequest, Movement } from './models';
export const IS_DEMO = import.meta.env.MODE === 'demo';
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
export const demoUsers: User[] = [
 {id:id(1),nombres:'Ana',apellidos:'Demo Administración',correo:'admin@example.invalid',area:'Sistemas',rol:'Administrador',estado:true,mustChangePassword:false,passwordChangedAt:'2026-11-21T12:00:00Z'},
 {id:id(2),nombres:'Luis',apellidos:'Demo Tecnología',correo:'tecnologia@example.invalid',area:'Tecnología',rol:'ResponsableTecnologia',estado:true,mustChangePassword:false,passwordChangedAt:'2026-11-21T12:00:00Z'},
 {id:id(3),nombres:'Elena',apellidos:'Demo Colaboración',correo:'colaboracion@example.invalid',area:'Marketing',rol:'Colaborador',estado:true,mustChangePassword:false,passwordChangedAt:'2026-11-21T12:00:00Z'},
];
export function demoUser(): User | null {
 try { const role=sessionStorage.getItem('techasset_demo_role'); return demoUsers.find(u=>u.rol===role)||null; } catch { return null; }
}
export function leaveDemo(){sessionStorage.removeItem('techasset_demo_role');}
const equipment: Equipment[] = [
 ['Laptop Dell Latitude 3420','Laptops','Dell','Disponible'],
 ['Computadora Desktop HP Pro','Computadoras de escritorio','HP','Prestado'],
 ['Monitor LG 27 pulgadas IPS','Monitores','LG','Disponible'],
 ['Impresora Epson EcoTank','Impresoras','Epson','Mantenimiento'],
 ['Tablet Samsung Galaxy Tab','Tablets','Samsung','Disponible'],
 ['Proyector Multimedia Epson','Proyectores multimedia','Epson','Baja'],
].map((x,i)=>({id:id(10+i),codigoPatrimonial:`DEMO-${String(i+1).padStart(3,'0')}`,nombre:x[0],categoria:x[1],marca:x[2],estado:x[3]}));
const loans: Loan[] = [
 {id:id(30),fechaPrestamo:'2026-11-20T14:00:00Z',fechaDevolucion:null,observacion:'Ejemplo de entrega con accesorios.',observacionDevolucion:null,usuarioId:id(3),usuarioNombre:'Elena Demo Colaboración',usuarioCorreo:'colaboracion@example.invalid',equipoId:id(11),equipoNombre:equipment[1].nombre,equipoCodigoPatrimonial:'DEMO-002',areaPrestamo:'Marketing',responsableId:id(2)},
 {id:id(31),fechaPrestamo:'2026-11-18T14:00:00Z',fechaDevolucion:'2026-11-19T18:00:00Z',observacion:'Préstamo histórico de ejemplo.',observacionDevolucion:'Recepción conforme de ejemplo.',usuarioId:id(3),usuarioNombre:'Elena Demo Colaboración',usuarioCorreo:'colaboracion@example.invalid',equipoId:id(14),equipoNombre:equipment[4].nombre,equipoCodigoPatrimonial:'DEMO-005',areaPrestamo:'Marketing',responsableId:id(2)},
];
const requests: LoanRequest[]=[{id:id(40),usuarioId:id(3),equipoId:id(10),motivo:'Solicitud de ejemplo para una presentación.',estado:'Pendiente',fechaSolicitud:'2026-11-21T12:00:00Z',usuarioNombre:'Elena Demo Colaboración',equipoNombre:equipment[0].nombre}];
const movements: Movement[] = [
 {id:id(50),fecha:'2026-11-20T14:00:00Z',entidad:'Préstamos y devoluciones',entidadId:id(30),accion:'Registro',detalle:'Ejemplo: asignación de DEMO-002 a Marketing.',responsable:'Luis Demo Tecnología'},
 {id:id(51),fecha:'2026-11-19T18:00:00Z',entidad:'Equipos',entidadId:id(14),accion:'Actualización',detalle:'Ejemplo: DEMO-005 vuelve a estar disponible.',responsable:'Luis Demo Tecnología'},
];
export const demoAdapter: AxiosAdapter = async config => {
 const url=(config.url||'').split('?')[0];
 if((config.method||'get').toLowerCase()!=='get') {
  const message='Demostración de solo lectura: los cambios se realizan en la instalación con API y PostgreSQL. No se guardó ningún dato.';
  throw new AxiosError(message,'DEMO_READ_ONLY',config,undefined,{data:{message},status:405,statusText:'Solo lectura',headers:{},config});
 }
 const user=demoUser(); const staff=user?.rol!=='Colaborador';
 const visibleLoans=staff?loans:loans.filter(l=>l.usuarioId===user?.id);
 const data: Record<string,unknown>={
  '/health':{status:'demo'}, '/equipment':equipment, '/users':staff?demoUsers:[],
  '/loans/history':visibleLoans,'/loans/active':visibleLoans.filter(l=>!l.fechaDevolucion),
  '/requests':staff?requests:requests.filter(r=>r.usuarioId===user?.id),'/movements':movements,
  '/auth/support-contacts':[{nombre:'Administración de ejemplo',correo:'soporte@example.invalid',area:'Sistemas'}],
  '/reports/dashboard':{totalEquipments:6,availableEquipments:3,loanedEquipments:1,maintenanceEquipments:1,decommissionedEquipments:1,totalLoans:2,areaConMayorUso:'Marketing',areaConMayorUsoCantidad:2},
  '/reports/loans-by-area':[{area:'Marketing',totalLoans:2,activeLoans:1}],
  '/reports/most-used-equipment':[1,4].map(i=>({equipmentId:equipment[i].id,...equipment[i],timesUsed:1})),
 };
 if(!(url in data)) return Promise.reject(new Error('Esta consulta no forma parte de la demostración de solo lectura.'));
 return {data:data[url],status:200,statusText:'DEMO',headers:{},config};
};
