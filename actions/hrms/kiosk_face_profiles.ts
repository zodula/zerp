import { z } from "bxo";

/**
 * Loads Employee Face Data for the current user's active Employee Kiosk row.
 * When filter_designation / filter_department / filter_branch are set on that row,
 * only face data for employees matching all set filters is returned.
 */
export default $action(async (ctx) => {
  const user = await $zodula.session.user();
  const kioskRes = await $zodula
    .doctype("Employee Kiosk")
    .select()
    .bypass(true)
    .where("user", "=", user.id)
    .where("is_active", "=", 1)
    .limit(1);
  const kiosk = kioskRes.docs?.[0] as any;
  if (!kiosk) {
    return ctx.json({
      needs_setup: true,
      kiosk_name: "Employee Kiosk",
      rows: [],
      employees: [],
      message: "No active Employee Kiosk linked to this user. Please ask HR/Admin to configure Employee Kiosk first.",
    });
  }

  const kioskName = String(kiosk.kiosk_name || "Employee Kiosk");
  const des = kiosk.filter_designation;
  const dep = kiosk.filter_department;
  const br = kiosk.filter_branch;
  const hasFilter = !!(des || dep || br);

  let employeeIds: string[] | null = null;
  if (hasFilter) {
    let empSel = $zodula.doctype("Employee").select().bypass(true).limit(10000);
    if (des) empSel = empSel.where("designation", "=", des);
    if (dep) empSel = empSel.where("department", "=", dep);
    if (br) empSel = empSel.where("branch", "=", br);
    const emps = await empSel;
    employeeIds = (emps.docs || []).map((d: any) => d.id).filter(Boolean);
    if (!employeeIds.length) {
      return ctx.json({ kiosk_name: kioskName, rows: [] });
    }
  }

  let faceSel = $zodula
    .doctype("Employee Face Data")
    .select()
    .bypass(true)
    .where("is_active", "=", 1)
    .limit(5000);
  if (hasFilter && employeeIds?.length) {
    faceSel = faceSel.where("employee", "IN", employeeIds);
  }
  const faces = await faceSel;
  const rows = faces.docs || [];
  const employeeMap = new Map<string, { id: string; name: string }>();
  for (const row of rows as any[]) {
    const id = String(row.employee || "");
    if (!id) continue;
    if (employeeMap.has(id)) continue;
    employeeMap.set(id, {
      id,
      name: String(row.employee_name || row.employee || ""),
    });
  }
  return ctx.json({
    needs_setup: false,
    kiosk_name: kioskName,
    rows,
    employees: Array.from(employeeMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
  });
}, {
  body: z.object({}).optional(),
});
