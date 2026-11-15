import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, RoleName } from '@prisma/client';
const prisma = new PrismaClient();
const categories=['Pain relief','Allergy care','Digestive health','First aid','Vitamins','Skin care','Respiratory care','Wellness'];
const products=[
['Aureline Relief 200','Demo ibuprofen','AR-200','Pain relief',20],['Cedar Calm 500','Demo paracetamol','CC-500','Pain relief',30],['Northstar Allergy 10','Demo antihistamine','NA-010','Allergy care',18],['ClearDay Digest 20','Demo antacid','CD-020','Digestive health',15],['Harbor Bandage Pack','Demo dressing','HB-100','First aid',25],['Brightwell C 500','Demo vitamin C','BC-500','Vitamins',20],['Juniper Zinc 15','Demo zinc supplement','JZ-015','Vitamins',12],['Evergreen Skin Balm','Demo topical balm','ES-010','Skin care',10],['Cloudbreak Saline 100','Demo saline spray','CS-100','Respiratory care',14],['Morrow Electrolyte','Demo oral salts','ME-020','Wellness',18],['Bluehaven Relief 400','Demo ibuprofen','BR-400','Pain relief',16],['Lumen Allergy 5','Demo antihistamine','LA-005','Allergy care',14],['Willow Digest 10','Demo digestive aid','WD-010','Digestive health',12],['Cove Gauze Roll','Demo gauze','CG-020','First aid',30],['Daymark D3 1000','Demo vitamin D','DD-100','Vitamins',15],['Oakroot Hand Cream','Demo skin cream','OH-050','Skin care',10],['Breeze Throat Lozenges','Demo lozenges','BT-024','Respiratory care',20],['Solace Hydration Tabs','Demo hydration tabs','SH-012','Wellness',16],['Ironwood Relief Gel','Demo topical gel','IR-030','Pain relief',12],['Petal Allergy 20','Demo antihistamine','PA-020','Allergy care',14],['Meadow Digest Plus','Demo digestive aid','MD-015','Digestive health',12],['Anchor First Aid Kit','Demo first aid kit','AF-001','First aid',8],['Sunfield B Complex','Demo vitamin B','SB-025','Vitamins',18],['Mosswell Skin Lotion','Demo skin lotion','MS-200','Skin care',12],['Skylark Cough Drops','Demo lozenges','SC-030','Respiratory care',15],['Tidepool Mineral Mix','Demo mineral mix','TM-010','Wellness',10],['Redfern Relief 100','Demo pain relief','RR-100','Pain relief',18],['Snowbell Allergy 25','Demo antihistamine','SA-025','Allergy care',12],['Fernway Digest 40','Demo digestive aid','FD-040','Digestive health',15],['Seabright Wound Pads','Demo dressing','SW-010','First aid',18]
];
async function main(){
 const hash=await bcrypt.hash('DemoOnly!2026',12);
 const demoAccounts:[string,string,RoleName][]=[
  ['admin@mediflow.demo','Administrator',RoleName.SUPER_ADMIN],
  ['manager@mediflow.demo','Dr. Sarah Jenkins',RoleName.PHARMACY_MANAGER],
  ['pharmacist@mediflow.demo','Rahul Sharma (Pharm.D)',RoleName.PHARMACIST],
  ['cashier@mediflow.demo','Priya Patel',RoleName.CASHIER],
  ['inventory@mediflow.demo','Vikram Mehta',RoleName.INVENTORY_MANAGER],
 ];
 for(const [email,name,roleName] of demoAccounts){
  const user=await prisma.user.upsert({where:{email},update:{name,passwordHash:hash,isActive:true},create:{name,email,passwordHash:hash}});
  const role=await prisma.role.upsert({where:{name:roleName},update:{},create:{name:roleName}});
  await prisma.userRole.upsert({where:{userId_roleId:{userId:user.id,roleId:role.id}},update:{},create:{userId:user.id,roleId:role.id}});
 }
 const categoryIds=new Map<string,string>();for(const name of categories){const c=await prisma.medicineCategory.upsert({where:{name},update:{},create:{name}});categoryIds.set(name,c.id);}
 const suppliers=[];for(let i=1;i<=5;i++)suppliers.push(await prisma.supplier.upsert({where:{id:`demo-supplier-${i}`},update:{},create:{id:`demo-supplier-${i}`,name:`Demo Supply House ${i}`,email:`orders${i}@supplier.demo`,phone:`+91 90000 0000${i}`,address:`${i} Market Road, Demo City`}}));
 for(let i=0;i<products.length;i++){const [name,genericName,sku,category,reorderLevel]=products[i] as [string,string,string,string,number];const medicine=await prisma.medicine.upsert({where:{sku},update:{},create:{name,genericName,sku,brand:'MediFlow Demo',unit:'pack',reorderLevel,categoryId:categoryIds.get(category)}});if(await prisma.medicineBatch.count({where:{medicineId:medicine.id}}))continue;const firstExpiry=new Date();firstExpiry.setDate(firstExpiry.getDate()+(i===0?12:i===1?-2:70+i*2));const laterExpiry=new Date();laterExpiry.setDate(laterExpiry.getDate()+400+i);const firstQty=i===2?3:20,secondQty=i===2?4:20;const seeded=await prisma.medicineBatch.createManyAndReturn({data:[{medicineId:medicine.id,supplierId:suppliers[i%5].id,batchNumber:`DEMO-${sku}-A`,expiryDate:firstExpiry,purchasePrice:45+i*2,sellingPrice:64+i*2,quantityReceived:firstQty,availableQuantity:firstQty},{medicineId:medicine.id,supplierId:suppliers[(i+1)%5].id,batchNumber:`DEMO-${sku}-B`,expiryDate:laterExpiry,purchasePrice:47+i*2,sellingPrice:66+i*2,quantityReceived:secondQty,availableQuantity:secondQty}]});await prisma.stockMovement.createMany({data:seeded.map(batch=>({medicineId:medicine.id,batchId:batch.id,type:'OPENING',quantity:batch.availableQuantity,referenceType:'DEMO_SEED',referenceId:batch.id,reason:'Fictional demo opening stock'}))});}
 await prisma.taxConfiguration.upsert({where:{id:'demo-tax'},update:{},create:{id:'demo-tax',name:'Demo tax',rate:5}});await prisma.pharmacySettings.upsert({where:{id:'default-settings'},update:{},create:{id:'default-settings',name:'Meadow Health Demo Pharmacy'}});
 console.info(`Seeded ${products.length} fictional demo medicines, ${categories.length} categories and ${suppliers.length} suppliers.`);
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect());
