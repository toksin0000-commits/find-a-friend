"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabase } from "@/lib/supabase";
const supabase = getSupabase();

import Link from "next/link";

// ------------------------------
// SHORT GLOBAL COUNTRY LIST
// ------------------------------
const COUNTRIES = [
  "Argentina",
  "Australia",
  "Austria",
  "Brazil",
  "Canada",
  "China",
  "Czech Republic",
  "Finland",
  "France",
  "Germany",
  "India",
  "Indonesia",
  "Israel",
  "Italy",
  "Japan",
  "Malaysia",
  "Mexico",
  "Netherlands",
  "New Zealand",
  "Norway",
  "Pakistan",
  "Philippines",
  "Poland",
  "Russia",
  "Saudi Arabia",
  "Slovakia",
  "South Korea",
  "Spain",
  "Sweden",
  "Thailand",
  "Turkey",
  "United Arab Emirates",
  "United Kingdom",
  "United States"
]
;

// ------------------------------
// SHORT GLOBAL LANGUAGE LIST
// ------------------------------
const LANGUAGES = [
  "Arabic",
  "Bengali",
  "Chinese (Mandarin)",
  "Czech",
  "English",
  "French",
  "German",
  "Hindi",
  "Indonesian",
  "Italian",
  "Japanese",
  "Javanese",
  "Korean",
  "Polish",
  "Portuguese",
  "Punjabi",
  "Russian",
  "Slovak",
  "Spanish",
  "Turkish",
  "Ukrainian",
  "Urdu",
  "Vietnamese"
]
;

// ------------------------------
// AGE OPTIONS
// ------------------------------
const AGES = Array.from({ length: 68 }, (_, i) => 13 + i);
// 13–80

export default function MeForm() {
  const photoFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [anonId, setAnonId] = useState<string | null>(null);

  const [form, setForm] = useState<{
  name: string;
  age: string;
  gender: string;
  country: string;
  language: string;
  interest: string;
  photo_url: string;
  latitude: string;
  longitude: string;
}>({
  name: "",
  age: "",
  gender: "",
  country: "",
  language: "",
  interest: "",
  photo_url: "",
  latitude: "",
  longitude: "",
});



  const [loading, setLoading] = useState(true);

  function generateUUID() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
    return (
      hex.substring(0, 8) +
      "-" +
      hex.substring(8, 12) +
      "-" +
      hex.substring(12, 16) +
      "-" +
      hex.substring(16, 20) +
      "-" +
      hex.substring(20)
    );
  }

  // Load or create anon_id
  useEffect(() => {
    let id = localStorage.getItem("anon_id");
    if (!id || id.length < 36) {
      id = generateUUID();
      localStorage.setItem("anon_id", id);
    }
    setAnonId(id);
  }, []);

  // Load profile
  useEffect(() => {
    if (!anonId) return;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("anon_id", anonId)
        .maybeSingle();


      if (data) {
        setForm({
  name: data.name || "",
  age: data.age || "",
  gender: data.gender || "",
  country: data.country || "",
  language: data.language || "",
  interest: data.interest || "",
  photo_url: data.photo_url || "",
  latitude: data.latitude || "",
  longitude: data.longitude || "",
});

      }

      setLoading(false);
    };

    loadProfile();
  }, [anonId]);


  // Auto-detect location on mount
useEffect(() => {
  if (!anonId) return;

  navigator.geolocation.getCurrentPosition(
    pos => {
      setForm(prev => ({
        ...prev,
        latitude: String(pos.coords.latitude),
        longitude: String(pos.coords.longitude),
      }));
    },
    err => {
      console.warn("Location denied or unavailable:", err);
    }
  );
}, [anonId]);


  const handleChange = (e: any) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
  if (!anonId) return;

  let photo_url = form.photo_url;

  // Upload photo
  if (photoFileRef.current) {
    const ext = photoFileRef.current.name.split(".").pop();
    const fileName = `${anonId}-${Date.now()}.${ext}`;
    const filePath = `profiles/${fileName}`;

    let { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(filePath, photoFileRef.current, { upsert: true });

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      photo_url = publicUrlData.publicUrl;
    }
  }

  // Save profile
  await supabase.from("profiles").upsert({
  anon_id: anonId,
  name: form.name || null,
  age: form.age === "" ? null : Number(form.age),
  gender: form.gender || null,
  country: form.country || null,
  language: form.language || null,
  interest: form.interest || null,
  photo_url,
  latitude: form.latitude === "" ? null : Number(form.latitude),
  longitude: form.longitude === "" ? null : Number(form.longitude),
});


  // 🔥 redirect after save
  window.location.href = "/";
};

// ===== SMAZÁNÍ ÚČTU =====
const handleDeleteAccount = async () => {
  if (!confirm('Are you sure you want to delete your account? This action is irreversible and all your data will be permanently removed.')) {
    return;
  }

  try {
    const res = await fetch('/api/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anonId })
    });

    const data = await res.json();

    if (res.ok) {
      alert('Your account has been successfully deleted.');
      localStorage.removeItem('anon_id');
      window.location.href = '/';
    } else {
      alert(`Error: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    alert('An unexpected error occurred');
  }
};


  if (loading) {
    return <div className="p-4 text-center">Loading…</div>;
  }

  return (
  <div className="relative z-999999 p-3 pt-1 max-w-sm mx-auto text-sm bg-[#3e3e3e] text-white min-h-screen">

      <h1 className="text-xl font-bold mb-2">Your Profile</h1>

      {/* PHOTO */}
      <div className="flex justify-center mb-2">
        <div
          className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          {form.photo_url ? (
            <img src={form.photo_url} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-500 text-sm">Add Photo</span>
          )}
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0] ?? null;
          photoFileRef.current = file;
        }}
      />

      {/* NAME */}
      <div className="mb-2">
        <label className="font-medium text-sm">Name</label>
        <input
          name="name"
          value={form.name}
          className="w-full p-1 border rounded text-sm"
          type="text"
          onChange={handleChange}
        />
      </div>

      {/* AGE + GENDER */}
<div className="flex gap-2 mb-2">
  <div className="flex-1">
    <label className="font-medium text-sm">Age</label>
    <select
      name="age"
      value={form.age}
      onChange={handleChange}
      className="w-full p-1 border rounded text-sm bg-white text-black"
    >
      <option value="">Select your age…</option>
      {AGES.map(a => (
        <option key={a} value={a}>{a}</option>
      ))}
    </select>
  </div>

  <div className="flex-1">
    <label className="font-medium text-sm">Gender</label>
    <select
      name="gender"
      value={form.gender}
      onChange={handleChange}
      className="w-full p-1 border rounded text-sm bg-white text-black"
    >
      <option value="">Select your gender…</option>
      <option value="male">Male</option>
      <option value="female">Female</option>
      <option value="other">Other</option>
    </select>
  </div>
</div>


      {/* COUNTRY */}
      <div className="mb-2">
        <label className="font-medium text-sm">Country</label>
        <select
          name="country"
          value={form.country}
          onChange={handleChange}
          className="w-full p-1 border rounded text-sm bg-white text-black"
        >
          <option value="">Select your country…</option>
          {COUNTRIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* LANGUAGE */}
<div className="mb-2">
  <label className="font-medium text-sm">Language</label>
  <select
    name="language"
    value={form.language}
    onChange={handleChange}
    className="w-full p-1 border rounded text-sm bg-white text-black"
  >
    <option value="">Select your language…</option>
    {LANGUAGES.map(l => (
      <option key={l} value={l}>{l}</option>
    ))}
  </select>
</div>


      {/* INTERESTS */}
<label className="font-medium text-sm">Interests</label>
<select
  name="interest"
  value={form.interest}
  onChange={(e) => {
    setForm(prev => ({
      ...prev,
      interest: e.target.value
    }));
  }}

  className="w-full p-1 border rounded mb-2 text-sm bg-white text-black"
>
  <option value="">Select your interest…</option>
  <option value="music">Music</option>
  <option value="gaming">Gaming</option>
  <option value="travel">Travel</option>
  <option value="sports">Sports</option>
  <option value="movies">Movies</option>
  <option value="art">Art</option>
  <option value="tech">Tech</option>
  <option value="fitness">Fitness</option>
</select>



            {/* SAVE BUTTON */}
      <button
        onClick={handleSave}
        className="relative z-999999 w-full bg-blue-600 text-white py-2 rounded text-sm mt-4"
      >
        Save & Go Home
      </button>

      {/* 🗑️ DELETE ACCOUNT BUTTON - vlož SEM */}
      <button
        onClick={handleDeleteAccount}
        className="w-full bg-red-700 text-white py-2 rounded text-sm mt-4 hover:bg-red-800"
      >
        Delete Account
      </button>

    </div>  
  );
}