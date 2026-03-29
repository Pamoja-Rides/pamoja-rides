import { DatePicker, Portal } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuCalendar } from "react-icons/lu";

export const DateCalendar = () => {
  const { t } = useTranslation();
  return (
    <DatePicker.Root colorPalette={"blue"}>
      <DatePicker.Control>
        <DatePicker.IndicatorGroup>
          <DatePicker.Trigger>
            <LuCalendar />
          </DatePicker.Trigger>
        </DatePicker.IndicatorGroup>
        <DatePicker.Input p={6} placeholder={t("homePage.placeholders.when")} />
      </DatePicker.Control>
      <Portal>
        <DatePicker.Positioner>
          <DatePicker.Content>
            <DatePicker.View view="day">
              <DatePicker.Header />
              <DatePicker.DayTable />
            </DatePicker.View>
            <DatePicker.View view="month">
              <DatePicker.Header />
              <DatePicker.MonthTable />
            </DatePicker.View>
            <DatePicker.View view="year">
              <DatePicker.Header />
              <DatePicker.YearTable />
            </DatePicker.View>
          </DatePicker.Content>
        </DatePicker.Positioner>
      </Portal>
    </DatePicker.Root>
  );
};
