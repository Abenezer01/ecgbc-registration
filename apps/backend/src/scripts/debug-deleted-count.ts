
import prisma from "../app/config/db.config";

async function debugDeleted() {
  const deletedState = await prisma.dataLookup.findFirst({
    where: { value: "objecjt_state_deleted" }, 
  });
  
  if (!deletedState) {
      console.log("DELETED state lookup not found");
      return;
  }
  
  const count = await prisma.member.count({
      where: { stateId: deletedState.id }
  });
  
  console.log(`Debug Script: Found ${count} members with stateID ${deletedState.id} (DELETED)`);
  
  const deletedMembers = await prisma.member.findMany({
      where: { stateId: deletedState.id },
      select: { id: true, name: true, isActive: true, state: { select: { value: true } } }
  });
  console.log("Deleted members details:", deletedMembers);
}

debugDeleted().catch(console.error).finally(()=>prisma.$disconnect());
