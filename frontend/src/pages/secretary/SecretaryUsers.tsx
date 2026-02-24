import React, { useEffect, useState } from "react";
import { getConsumers } from "@/services/consumer.service";
import { getAllSecretaries } from "@/services/secretary.service";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { log } from "util";

const secretaryNavItems = [
  { label: 'Overview', href: '/secretary' },
  { label: 'My Users', href: '/secretary/Users' },

];
interface Consumer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  locationId?: string;
  meterId?: string;
}

interface Secretary {
  _id: string;
  userId: string;
  locationId: string;
}

const SecretaryUsers: React.FC = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const [allConsumers, setAllConsumers] = useState<Consumer[]>([]);
  const [secretaryLocationId, setSecretaryLocationId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // ✅ Fetch 
        const consumersRes = await getConsumers();
        console.log(consumersRes);
        
        const consumersArray =
          Array.isArray(consumersRes) ? consumersRes :
          Array.isArray(consumersRes.data) ? consumersRes.data :
          Array.isArray(consumersRes.data?.data) ? consumersRes.data.data :
          [];

        setAllConsumers(consumersArray);

        const secretariesRes = await getAllSecretaries();
        const secretariesArray =
          Array.isArray(secretariesRes) ? secretariesRes :
          Array.isArray(secretariesRes.data) ? secretariesRes.data :
          Array.isArray(secretariesRes.data?.data) ? secretariesRes.data.data :
          [];

        const loggedSecretary = secretariesArray.find(
          (s: Secretary) => s.userId === user.id
        );

        if (loggedSecretary) {
          setSecretaryLocationId(loggedSecretary.locationId);
        }

      } catch (error) {
        console.error("Error loading secretary users:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // ✅ Filter consumers by location
  const assignedConsumers = allConsumers.filter(
    (c) =>
      c.locationId?.toString() === secretaryLocationId?.toString()
  );

  if (loading) {
    return <div className="p-4">Loading users...</div>;
  }

  return (
        <DashboardLayout navItems={secretaryNavItems} title="Secretary Dashboard">
      <div className="space-y-6 animate-fade-in" key={refreshKey}>

    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Location Consumers</h2>

      {assignedConsumers.length === 0 ? (
        <p>No users found for your location.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Email</th>
                <th className="p-3 border">Phone</th>
                <th className="p-3 border">Address</th>
                <th className="p-3 border">Meter ID</th>
              </tr>
            </thead>
            <tbody>
              {assignedConsumers.map((consumer) => (
                <tr key={consumer._id} className="text-center">
                  <td className="p-3 border">{consumer.name}</td>
                  <td className="p-3 border">{consumer.email}</td>
                  <td className="p-3 border">{consumer.phone || "-"}</td>
                  <td className="p-3 border">{consumer.address || "-"}</td>
                  <td className="p-3 border">{consumer.meterId || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

          </div>
    </DashboardLayout>
  );

};

export default SecretaryUsers;