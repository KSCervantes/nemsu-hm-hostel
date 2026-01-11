"use client";

import React, { useState } from "react";

export default function ReservationForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState<number>(2);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<null | "idle" | "sent" | "error">("idle");

  function submitReservation() {
    if (!name || !phone || !date || !time) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
      return;
    }

    const subject = encodeURIComponent(`Hostel Reservation: ${name} - ${date} ${time}`);
    const body = encodeURIComponent(
      `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nDate: ${date}\nTime: ${time}\nGuests: ${guests}\nNotes: ${notes}`
    );

    // open default mail client with prefilled content
    window.location.href = `mailto:hello@hostel.com?subject=${subject}&body=${body}`;
    setStatus("sent");
    setTimeout(() => setStatus("idle"), 4000);

    // reset (optional)
    setName("");
    setPhone("");
    setEmail("");
    setDate("");
    setTime("");
    setGuests(2);
    setNotes("");
  }

}
