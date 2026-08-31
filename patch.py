
import re

with open("apps/backend/src/app/features/member/controllers/member.controller.ts", "r", encoding="utf-8") as f:
    content = f.read()

change_logic = """
    const changes: Record<string, { old: any, new: any }> = {};

    const trackChange = (field: string, oldVal: any, newVal: any) => {
      if (newVal !== undefined && oldVal !== newVal) {
        changes[field] = { old: oldVal || null, new: newVal || null };
      }
    };
    
    // Core fields
    trackChange("phoneNumber", currentMember.phoneNumber, phoneNumber);
    trackChange("regionId", currentMember.regionId, regionId);
    trackChange("stateId", currentMember.stateId, stateId);
    trackChange("city", currentMember.city, city);
    trackChange("subcity", currentMember.subcity, subcity);
    trackChange("zone", currentMember.zone, zone);
    trackChange("district", currentMember.district, district);
    trackChange("houseNumber", currentMember.houseNumber, houseNumber);
    trackChange("poBoxNumber", currentMember.poBoxNumber, poBoxNumber);
    trackChange("typeId", currentMember.typeId, typeId);
    trackChange("memberCategoryId", currentMember.memberCategoryId, memberCategoryId);
    
    if (contactPersonFullName && contactPersonPhoneNumber) {
       const cpOldName = currentMember.contactPerson?.fullName;
       const cpOldPhone = currentMember.contactPerson?.phoneNumber;
       if (cpOldName !== contactPersonFullName || cpOldPhone !== contactPersonPhoneNumber) {
           changes["contactPerson"] = {
               old: currentMember.contactPerson ? `${cpOldName} (${cpOldPhone})` : null,
               new: `${contactPersonFullName} (${contactPersonPhoneNumber})`
           };
       }
    } else if (updatedData.contactPerson?.delete) {
       changes["contactPerson"] = {
           old: currentMember.contactPerson ? `${currentMember.contactPerson.fullName} (${currentMember.contactPerson.phoneNumber})` : null,
           new: null
       };
    }

    // Log activity
"""

metadata_logic = """metadata: { memberId: member.id, name: member.name, certificateNo: member.certificateNo, changes: Object.keys(changes).length > 0 ? changes : undefined },"""

content = content.replace("    // Log activity\n", change_logic)
content = content.replace("metadata: { memberId: member.id, name: member.name, certificateNo: member.certificateNo },", metadata_logic)

with open("apps/backend/src/app/features/member/controllers/member.controller.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("done")
