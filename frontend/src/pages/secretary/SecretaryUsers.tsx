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
          (s: Secretary) => s._id === user.id
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

 

 return (
  <DashboardLayout navItems={secretaryNavItems} title="Secretary Dashboard">
    <div className="space-y-6 animate-fade-in" key={refreshKey}>
      <div className="p-6">

        <h2 className="text-2xl font-bold mb-6">Location Consumers</h2>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
          </div>
        ) : assignedConsumers.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No users found for your location.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white shadow-lg rounded-xl">
            <table className="min-w-full text-sm text-left text-gray-600">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Meter ID</th>
                </tr>
              </thead>
              <tbody>
                {assignedConsumers.map((consumer, index) => (
                  <tr
                    key={consumer._id}
                    className={`border-b hover:bg-blue-50 transition ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <td className="px-6 py-3 font-medium text-gray-800">
                      {consumer.name}
                    </td>
                    <td className="px-6 py-3">{consumer.email}</td>
                    <td className="px-6 py-3 font-semibold text-blue-600">
                      {consumer.meterId || "-"}
                    </td>
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