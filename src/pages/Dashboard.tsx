import { useAuth } from "@/contexts/AuthContext";
import StudentDashboard from "@/components/dashboards/StudentDashboard";
import TeacherDashboard from "@/components/dashboards/TeacherDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";

export default function Dashboard() {
  const { profile } = useAuth();
  const role = profile?.role || "student";

  if (role === "admin" || role === "developer") return <AdminDashboard />;
  if (role === "teacher") return <TeacherDashboard />;
  return <StudentDashboard />;
}
