export type DateFilter = "today" | "week" | "month" | "";
export type TimeFilter = "morning" | "afternoon" | "evening" | "";
export type SortOption = "price_asc" | "price_desc" | "";

export interface SearchFilters {
  date: DateFilter;
  seats: number;
  time: TimeFilter;
  sort: SortOption;
}

export const DEFAULT_FILTERS: SearchFilters = {
  date: "",
  seats: 1,
  time: "",
  sort: "",
};
