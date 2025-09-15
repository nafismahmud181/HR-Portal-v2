"use client";

import { useState } from "react";

interface CompanySettings {
  workingHours: {
    mondayToFriday: { start: string; end: string };
    weekendDays: string[];
    timeZone: string;
  };
  holidays: {
    national: string[];
    company: string[];
    floating: number;
  };
  fiscalYear: {
    startMonth: string;
    payrollYear: string;
  };
  remoteWorkPolicy: {
    allowed: boolean;
    hybrid: boolean;
    geographicRestrictions: string[];
  };
  [key: string]: unknown;
}

interface BusinessConfigSectionProps {
  formData: CompanySettings;
  onInputChange: (field: string, value: string | number | boolean | string[]) => void;
  onNestedInputChange: (parent: string, field: string, value: unknown) => void;
}

const TIME_ZONES = [
  "UTC-12:00", "UTC-11:00", "UTC-10:00", "UTC-09:00", "UTC-08:00",
  "UTC-07:00", "UTC-06:00", "UTC-05:00", "UTC-04:00", "UTC-03:00",
  "UTC-02:00", "UTC-01:00", "UTC+00:00", "UTC+01:00", "UTC+02:00",
  "UTC+03:00", "UTC+04:00", "UTC+05:00", "UTC+06:00", "UTC+07:00",
  "UTC+08:00", "UTC+09:00", "UTC+10:00", "UTC+11:00", "UTC+12:00"
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const COMMON_HOLIDAYS = [
  "New Year's Day", "Martin Luther King Jr. Day", "Presidents' Day", "Memorial Day",
  "Independence Day", "Labor Day", "Columbus Day", "Veterans Day", "Thanksgiving Day", "Christmas Day"
];

export default function BusinessConfigSection({ formData, onNestedInputChange }: BusinessConfigSectionProps) {
  const [newCompanyHoliday, setNewCompanyHoliday] = useState("");
  const [newGeographicRestriction, setNewGeographicRestriction] = useState("");

  const addCompanyHoliday = () => {
    if (newCompanyHoliday.trim()) {
      const updatedHolidays = [...formData.holidays.company, newCompanyHoliday.trim()];
      onNestedInputChange("holidays", "company", updatedHolidays);
      setNewCompanyHoliday("");
    }
  };

  const removeCompanyHoliday = (index: number) => {
    const updatedHolidays = formData.holidays.company.filter((_: string, i: number) => i !== index);
    onNestedInputChange("holidays", "company", updatedHolidays);
  };

  const addGeographicRestriction = () => {
    if (newGeographicRestriction.trim()) {
      const updatedRestrictions = [...formData.remoteWorkPolicy.geographicRestrictions, newGeographicRestriction.trim()];
      onNestedInputChange("remoteWorkPolicy", "geographicRestrictions", updatedRestrictions);
      setNewGeographicRestriction("");
    }
  };

  const removeGeographicRestriction = (index: number) => {
    const updatedRestrictions = formData.remoteWorkPolicy.geographicRestrictions.filter((_: string, i: number) => i !== index);
    onNestedInputChange("remoteWorkPolicy", "geographicRestrictions", updatedRestrictions);
  };

  const toggleNationalHoliday = (holiday: string) => {
    const currentHolidays = formData.holidays.national;
    const updatedHolidays = currentHolidays.includes(holiday)
      ? currentHolidays.filter(h => h !== holiday)
      : [...currentHolidays, holiday];
    onNestedInputChange("holidays", "national", updatedHolidays);
  };

  const toggleWeekendDay = (day: string) => {
    const currentDays = formData.workingHours.weekendDays;
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    onNestedInputChange("workingHours", "weekendDays", updatedDays);
  };

  return (
    <div className="space-y-8">
      {/* Working Hours & Calendar */}
      <section>
        <h2 className="text-[20px] font-semibold mb-6">Working Hours & Calendar</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[14px] font-medium mb-2">Standard Business Hours</label>
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] text-[#6b7280] mb-1">Monday to Friday</label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={formData.workingHours.mondayToFriday.start}
                    onChange={(e) => onNestedInputChange("workingHours", "mondayToFriday", {
                      ...formData.workingHours.mondayToFriday,
                      start: e.target.value
                    })}
                    className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                  />
                  <span className="text-[14px] text-[#6b7280]">to</span>
                  <input
                    type="time"
                    value={formData.workingHours.mondayToFriday.end}
                    onChange={(e) => onNestedInputChange("workingHours", "mondayToFriday", {
                      ...formData.workingHours.mondayToFriday,
                      end: e.target.value
                    })}
                    className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Time Zone</label>
            <select
              value={formData.workingHours.timeZone}
              onChange={(e) => onNestedInputChange("workingHours", "timeZone", e.target.value)}
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            >
              {TIME_ZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-[14px] font-medium mb-2">Weekend Working Days</label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <button
                key={day}
                onClick={() => toggleWeekendDay(day)}
                className={`px-3 py-2 rounded-md text-[12px] border transition-colors ${
                  formData.workingHours.weekendDays.includes(day)
                    ? "border-[#f97316] text-[#f97316] bg-[#fef7ed]"
                    : "border-[#e5e7eb] text-[#374151] bg-white hover:bg-[#f9fafb]"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Holiday Calendar */}
      <section>
        <h2 className="text-[20px] font-semibold mb-6">Holiday Calendar</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[14px] font-medium mb-2">National Holidays</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-[#e5e7eb] rounded-md p-3">
              {COMMON_HOLIDAYS.map((holiday) => (
                <label key={holiday} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.holidays.national.includes(holiday)}
                    onChange={() => toggleNationalHoliday(holiday)}
                    className="rounded border-[#d1d5db]"
                  />
                  <span className="text-[14px]">{holiday}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Company-Specific Holidays</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCompanyHoliday}
                  onChange={(e) => setNewCompanyHoliday(e.target.value)}
                  placeholder="Add company holiday"
                  className="flex-1 rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                />
                <button
                  onClick={addCompanyHoliday}
                  className="px-3 py-2 bg-[#f97316] text-white rounded-md text-[14px] hover:bg-[#ea580c]"
                >
                  Add
                </button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {formData.holidays.company.map((holiday: string, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-[#f9fafb] px-3 py-2 rounded-md">
                    <span className="text-[14px]">{holiday}</span>
                    <button
                      onClick={() => removeCompanyHoliday(index)}
                      className="text-[#dc2626] hover:text-[#b91c1c] text-[12px]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-[14px] font-medium mb-2">Floating Holidays Allocation</label>
          <input
            type="number"
            value={formData.holidays.floating}
            onChange={(e) => onNestedInputChange("holidays", "floating", parseInt(e.target.value) || 0)}
            min="0"
            max="10"
            className="w-32 rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
          <p className="mt-1 text-[12px] text-[#6b7280]">Number of floating holidays employees can choose</p>
        </div>
      </section>

      {/* Fiscal Year Settings */}
      <section>
        <h2 className="text-[20px] font-semibold mb-6">Fiscal Year Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[14px] font-medium mb-2">Fiscal Year Start Month</label>
            <select
              value={formData.fiscalYear.startMonth}
              onChange={(e) => onNestedInputChange("fiscalYear", "startMonth", e.target.value)}
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            >
              {MONTHS.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Payroll Year Configuration</label>
            <input
              type="text"
              value={formData.fiscalYear.payrollYear}
              onChange={(e) => onNestedInputChange("fiscalYear", "payrollYear", e.target.value)}
              placeholder="2024"
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
        </div>
      </section>

      {/* Remote Work Policy */}
      <section>
        <h2 className="text-[20px] font-semibold mb-6">Remote Work Policy</h2>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.remoteWorkPolicy.allowed}
                onChange={(e) => onNestedInputChange("remoteWorkPolicy", "allowed", e.target.checked)}
                className="rounded border-[#d1d5db]"
              />
              <span className="text-[14px] font-medium">Remote work allowed</span>
            </label>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.remoteWorkPolicy.hybrid}
                onChange={(e) => onNestedInputChange("remoteWorkPolicy", "hybrid", e.target.checked)}
                className="rounded border-[#d1d5db]"
              />
              <span className="text-[14px] font-medium">Hybrid work options available</span>
            </label>
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Geographic Restrictions</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGeographicRestriction}
                  onChange={(e) => setNewGeographicRestriction(e.target.value)}
                  placeholder="Add geographic restriction"
                  className="flex-1 rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                />
                <button
                  onClick={addGeographicRestriction}
                  className="px-3 py-2 bg-[#f97316] text-white rounded-md text-[14px] hover:bg-[#ea580c]"
                >
                  Add
                </button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {formData.remoteWorkPolicy.geographicRestrictions.map((restriction: string, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-[#f9fafb] px-3 py-2 rounded-md">
                    <span className="text-[14px]">{restriction}</span>
                    <button
                      onClick={() => removeGeographicRestriction(index)}
                      className="text-[#dc2626] hover:text-[#b91c1c] text-[12px]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
