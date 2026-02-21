"use client";

import { useState, useEffect } from "react";
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

const DISTANCES = [
  1,
  2,
  3,
  5,
  10,
  15,
  20,
  30,
  50,
  75,
  100,
  150,
  200,
  300,
];



// ------------------------------
// AGE OPTIONS (13–80)
// ------------------------------
const AGES = Array.from({ length: 68 }, (_, i) => 13 + i);

// 🔥 Bezpečná funkce pro generování anon_id
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function YouForm() {
  const [anonId, setAnonId] = useState<string | null>(null);

  const [form, setForm] = useState<{
  preferred_gender: string;
  preferred_country: string;
  preferred_language: string;
  preferred_min_age: string;
  preferred_max_age: string;
  preferred_interest: string;
  preferred_max_distance_km: string;
}>({
  preferred_gender: "",
  preferred_country: "",
  preferred_language: "",
  preferred_min_age: "",
  preferred_max_age: "",
  preferred_interest: "",         
  preferred_max_distance_km: "",
});



  const [loading, setLoading] = useState(true);

  // Load anon_id
  useEffect(() => {
    let id = localStorage.getItem("anon_id");

    if (!id || id.length < 36) {
      id = generateId();
      localStorage.setItem("anon_id", id);
    }

    setAnonId(id);
  }, []);

  // Load preferences
  useEffect(() => {
    if (!anonId) return;

    const loadPreferences = async () => {
      if (!supabase) return;

const { data } = await supabase
  .from("preferences")
  .select("*")
  .eq("anon_id", anonId)
  .single();


      if (data) {
        setForm({
  preferred_gender: data.preferred_gender || "",
  preferred_country: data.preferred_country || "",
  preferred_language: data.preferred_language || "",
  preferred_min_age: data.preferred_min_age || "",
  preferred_max_age: data.preferred_max_age || "",
  preferred_interest: data.preferred_interest || "",
  preferred_max_distance_km: data.preferred_max_distance_km || "",
});

      }

      setLoading(false);
    };

    loadPreferences();
  }, [anonId]);

  const handleChange = (e: any) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
  if (!anonId) return;

  const payload = {
  anon_id: anonId,
  preferred_gender: form.preferred_gender || null,
  preferred_country: form.preferred_country || null,
  preferred_language: form.preferred_language || null,
  preferred_min_age:
    form.preferred_min_age === "" ? null : Number(form.preferred_min_age),
  preferred_max_age:
    form.preferred_max_age === "" ? null : Number(form.preferred_max_age),

  // ⭐ sjednoceno – stejný pattern jako gender/country
  preferred_interest: form.preferred_interest || null,

  preferred_max_distance_km:
    form.preferred_max_distance_km === ""
      ? null
      : Number(form.preferred_max_distance_km),
};



  if (!supabase) {
  console.warn("Supabase is disabled during build.");
  return;
}

const { error } = await supabase.from("preferences").upsert(payload);

if (error) {
  console.error("Error saving preferences:", error);
  return;
}


  // 🔥 SAVE + GO HOME
  window.location.href = "/";
};


  if (!anonId || loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
  <div className="p-4 max-w-sm mx-auto text-sm bg-[#6c6c6c] text-white min-h-screen">

      <h1 className="text-xl font-bold mb-3">Your Preferences</h1>

      {/* Preferred Gender */}
      <div className="mb-2">
        <label className="font-medium text-sm">Preferred Gender</label>
        <select
          name="preferred_gender"
          value={form.preferred_gender}
          onChange={handleChange}
          className="w-full p-1 border rounded text-sm bg-white text-black"
        >
          <option value="">Select preferred gender…</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* PREFERRED AGE RANGE */}
<div className="flex gap-2 mb-2">
  <div className="flex-1">
    <label className="font-medium text-sm">Min Age</label>
    <select
      name="preferred_min_age"
      value={form.preferred_min_age}
      onChange={handleChange}
      className="w-full p-1 border rounded text-sm bg-white text-black"
    >
      <option value="">No minimum…</option>
      {AGES.map(a => (
        <option key={a} value={a}>{a}</option>
      ))}
    </select>
  </div>

  <div className="flex-1">
    <label className="font-medium text-sm">Max Age</label>
    <select
      name="preferred_max_age"
      value={form.preferred_max_age}
      onChange={handleChange}
      className="w-full p-1 border rounded text-sm bg-white text-black"
    >
      <option value="">No maximum…</option>
      {AGES.map(a => (
        <option key={a} value={a}>{a}</option>
      ))}
    </select>
  </div>
</div>


      {/* Preferred Country */}
      <label className="font-medium">Preferred Country</label>
      <select
        name="preferred_country"
        value={form.preferred_country}
        onChange={handleChange}
        className="w-full p-1.5 border rounded mb-2 bg-white text-black"
      >
        <option value="">No preference</option>
        {COUNTRIES.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* PREFERRED LANGUAGE */}
<div className="mb-2">
  <label className="font-medium text-sm">Preferred Language</label>
  <select
    name="preferred_language"
    value={form.preferred_language}
    onChange={handleChange}
    className="w-full p-1 border rounded text-sm bg-white text-black"
  >
    <option value="">No preference…</option>
    {LANGUAGES.map(l => (
      <option key={l} value={l}>{l}</option>
    ))}
  </select>
</div>

{/* Max Distance */}
<div className="mb-2">
  <label className="font-medium text-sm">Max Distance (km)</label>
  <select
    name="preferred_max_distance_km"
    value={form.preferred_max_distance_km}
    onChange={handleChange}
    className="w-full p-1 border rounded text-sm bg-white text-black"
  >
    <option value="">No limit…</option>
    {DISTANCES.map(d => (
      <option key={d} value={d}>{d} km</option>
    ))}
  </select>
</div>



      {/* Preferred Interests */}
      <label className="font-medium text-sm">Preferred Interest</label>
<select
  name="preferred_interest"
  value={form.preferred_interest}
  onChange={(e) =>
    setForm(prev => ({
      ...prev,
      preferred_interest: e.target.value
    }))
  }
  className="w-full p-1 border rounded mb-2 text-sm bg-white text-black"
>
  <option value="">No preference…</option>
  <option value="music">Music</option>
  <option value="gaming">Gaming</option>
  <option value="travel">Travel</option>
  <option value="sports">Sports</option>
  <option value="movies">Movies</option>
  <option value="art">Art</option>
  <option value="tech">Tech</option>
  <option value="fitness">Fitness</option>
</select>




      <button
        onClick={handleSave}
        className="w-full bg-blue-600 text-white py-2 rounded text-sm mt-6"
      >
        Save & Go Home

      </button>

      
    </div>
  );
}
