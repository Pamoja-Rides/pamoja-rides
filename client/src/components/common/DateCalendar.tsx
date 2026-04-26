"use client";

import { PostRideContext } from "@/context/postRide-context";
import { DatePicker, Input, InputGroup, Portal } from "@chakra-ui/react";
import {
  CalendarDateTime,
  DateFormatter,
  type DateValue,
  getLocalTimeZone,
  today,
} from "@internationalized/date";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuCalendar } from "react-icons/lu";

const formatter = new DateFormatter("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const DateCalendar = () => {
  const currentDate = new Date();
  const { t } = useTranslation();
  const [value, setValue] = useState<CalendarDateTime[]>([
    new CalendarDateTime(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      currentDate.getDate(),
      currentDate.getHours(),
      currentDate.getMinutes(),
    ),
  ]);
  const context = useContext(PostRideContext);

  useEffect(() => {
    if (value[0] && context) {
      const dateObj = value[0].toDate(getLocalTimeZone());
      context.setFormData((prev) => ({
        ...prev,
        departure_datetime: dateObj.toISOString(),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const timeValue =
    value[0] && value[0].hour > currentDate.getHours()
      ? `${String(value[0].hour).padStart(2, "0")}:${String(value[0].minute).padStart(2, "0")}`
      : "";

  const onTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.currentTarget.value.split(":").map(Number);

    setValue((prev) => {
      const current =
        prev[0] ??
        new CalendarDateTime(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          currentDate.getDate(),
          currentDate.getHours(),
          currentDate.getMinutes(),
        );
      const now = new Date();

      // Check if the selected date is "today"
      const isToday =
        current.year === now.getFullYear() &&
        current.month === now.getMonth() + 1 &&
        current.day === now.getDate();

      if (isToday) {
        // If today, prevent picking a past hour/minute
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        if (
          hours < currentHour ||
          (hours === currentHour && minutes < currentMinute)
        ) {
          // Option A: Reset to current time
          return [current.set({ hour: currentHour, minute: currentMinute })];
        }
      }

      // Otherwise, allow the change
      return [current.set({ hour: hours, minute: minutes })];
    });
  };

  const onDateChange = (details: { value: DateValue[] }) => {
    const newDate = details.value[0];
    if (!newDate) return setValue([]);
    const prevTime = value[0] ?? { hour: 0, minute: 0 };
    setValue([
      new CalendarDateTime(
        newDate.year,
        newDate.month,
        newDate.day,
        prevTime.hour,
        prevTime.minute,
      ),
    ]);
  };

  return (
    <DatePicker.Root
      value={value}
      onValueChange={onDateChange}
      openOnClick
      hideOutsideDays
      min={today(getLocalTimeZone())}
    >
      <DatePicker.Control>
        <DatePicker.Trigger asChild unstyled>
          <InputGroup
            endElement={<LuCalendar />}
            colorPalette={"blue"}
            onChange={() => console.log("val", value)}
          >
            <Input
              p={6}
              placeholder={t("homePage.placeholders.when")}
              value={
                value[0]
                  ? formatter.format(value[0].toDate(getLocalTimeZone()))
                  : ""
              }
              onChange={() => {}}
            />
          </InputGroup>
        </DatePicker.Trigger>
      </DatePicker.Control>
      <Portal>
        <DatePicker.Positioner>
          <DatePicker.Content>
            <DatePicker.View view="day">
              <DatePicker.Header />
              <DatePicker.DayTable />
              <Input type="time" value={timeValue} onChange={onTimeChange} />
            </DatePicker.View>
          </DatePicker.Content>
        </DatePicker.Positioner>
      </Portal>
    </DatePicker.Root>
  );
};
