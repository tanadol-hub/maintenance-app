import MaintenanceForm from "@/components/MaintenanceForm"; // ปรับ path ให้ตรงกับที่เก็บไฟล์ของคุณ

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <MaintenanceForm />
    </main>
  );
}