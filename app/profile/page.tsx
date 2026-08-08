"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackgroundPattern from "@/components/BackgroundPattern";
import Image from "next/image";
import SignOutButton from "@/components/SignOutButton";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import {
  Pencil,
  Save,
  X,
  Map as MapIcon,
  Building2,
  MapPin,
  User,
  MapPinned,
  Mail,
} from "lucide-react";
import CompleteProfileSheet from "@/components/CompleteProfileSheet";
import { indianStatesAndCities } from "@/lib/states";
import { validatePincode } from "@/lib/pincode-validator";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    city: "",
    pincode: "",
  });

  const availableStates = Object.keys(indianStatesAndCities).sort();
  const availableCities = formData.state
    ? (indianStatesAndCities[formData.state] || []).sort()
    : [];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || "",
          state: data.state || "",
          city: data.city || "",
          pincode: data.pincode || "",
        });
        setUserData(data);
      }
    } catch (error) {
      console.error("Failed to fetch user data", error);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  const [userData, setUserData] = useState<any>(null);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <BackgroundPattern />
        <p className="text-slate-900 font-medium">Loading...</p>
      </div>
    );
  }

  if (!session?.user) return null;

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    if (formData.state && formData.city && formData.pincode) {
      const validation = validatePincode(
        formData.state,
        formData.city,
        formData.pincode,
      );
      if (!validation.isValid) {
        toast.error(validation.message || "Invalid Pincode");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          state: formData.state,
          city: formData.city,
          pincode: formData.pincode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Update failed");
      }

      await update();

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: session.user.name || "",
      state: userData?.state || "",
      city: userData?.city || "",
      pincode: userData?.pincode || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 ">
      <BackgroundPattern />
      <Card className="w-full max-w-4xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
        <div className="h-1.5 bg-linear-to-r from-amber-500 via-orange-500 to-emerald-600 w-full" />
        <CardHeader className="text-center relative border-b border-slate-100 pb-4 pt-6">
          <CardTitle className="text-2xl font-extrabold text-slate-800 tracking-tight">
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 pt-6 px-8">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border border-slate-200 shadow-md ring-4 ring-orange-500/10 shrink-0">
            {session.user.image || (session.user as any).avatar ? (
              <Image
                src={
                  session.user.image ||
                  (session.user as any).avatar ||
                  "https://robohash.org/placeholder"
                }
                alt="Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-3xl">
                {session.user.name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="w-full space-y-5 px-2">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="border border-black focus-visible:ring-4 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 rounded-xl bg-slate-50/85 h-11 text-sm font-medium text-slate-800 transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={session.user.email || ""}
                    disabled
                    className="border border-black rounded-xl bg-slate-100/50 text-slate-400 font-medium h-11 text-sm cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 font-medium">
                    Email cannot be changed
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="state"
                      className="text-slate-700 font-semibold text-sm"
                    >
                      State
                    </Label>
                    <select
                      id="state"
                      value={formData.state}
                      onChange={(e) => {
                        const newState = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          state: newState,
                          city: "", // Reset city when state changes
                          pincode: "", // Reset pincode when state changes
                        }));
                      }}
                      className="w-full border border-black rounded-xl p-3 bg-slate-50/85 outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 text-sm font-medium text-slate-800 h-[46px]"
                    >
                      <option value="">Select State</option>
                      {availableStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="city"
                      className="text-slate-700 font-semibold text-sm"
                    >
                      City
                    </Label>
                    <select
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          city: e.target.value,
                          pincode: "",
                        }))
                      }
                      disabled={!formData.state}
                      className="w-full border border-black rounded-xl p-3 bg-slate-50/85 disabled:bg-slate-100/50 disabled:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-200 text-sm font-medium text-slate-800 h-[46px]"
                    >
                      <option value="">Select City</option>
                      {availableCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="pincode"
                      className="text-slate-700 font-semibold text-sm"
                    >
                      Pincode
                    </Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pincode: e.target.value,
                        }))
                      }
                      maxLength={6}
                      disabled={!formData.city}
                      className="border border-black focus-visible:ring-4 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 rounded-xl bg-slate-50/85 hover:bg-slate-50/95 h-11 disabled:bg-slate-100/50 disabled:text-slate-400 text-sm font-medium text-slate-800 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold bg-linear-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/15 transition-all duration-200 border-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 hover:shadow-sm active:shadow-none transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 border-2 border-black rounded-xl p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors duration-200">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50">
                      <User className="h-5 w-5 text-slate-650" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Name
                      </p>
                      <p className="text-base font-extrabold text-slate-800">
                        {session.user.name}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 border-2 border-black rounded-xl p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors duration-200">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50">
                      <Mail className="h-5 w-5 text-slate-650" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Email
                      </p>
                      <p className="text-base font-extrabold text-slate-800 break-all">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Grid Section */}
                {userData && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Address Fields */}
                    {(userData.isAddressUpdated ||
                      (userData.state &&
                        userData.city &&
                        userData.pincode)) && (
                      <>
                        <div className="bg-slate-50/50 border-2 border-black rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1 hover:bg-slate-50 transition-colors duration-200">
                          <MapIcon className="h-5 w-5 text-slate-400" />
                          <p className="text-sm font-extrabold text-slate-800 mt-1">
                            {userData.state}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            State
                          </p>
                        </div>
                        <div className="bg-slate-50/50 border-2 border-black rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1 hover:bg-slate-50 transition-colors duration-200">
                          <MapPinned className="h-5 w-5 text-slate-400" />
                          <p className="text-sm font-extrabold text-slate-800 mt-1">
                            {userData.city}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            City
                          </p>
                        </div>
                        <div className="bg-slate-50/50 border-2 border-black rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1 hover:bg-slate-50 transition-colors duration-200">
                          <MapPin className="h-5 w-5 text-slate-400" />
                          <p className="text-sm font-extrabold text-slate-800 mt-1">
                            {userData.pincode}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            Pincode
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="w-full px-2 pt-2 space-y-3">
            {!isEditing && (
              <div className="flex gap-3 w-full">
                <CompleteProfileSheet
                  userData={userData}
                  onUpdate={fetchUserData}
                />
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-bold bg-linear-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/15 transition-all duration-200 border-none cursor-pointer whitespace-nowrap"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </button>
              </div>
            )}
            {!isEditing && <SignOutButton />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
