import {
  Badge,
  Box,
  Button,
  Center,
  Container,
  Flex,
  HStack,
  Icon,
  IconButton,
  Separator,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  LuArrowLeft,
  LuCircleCheck,
  LuClock,
  LuRefreshCw,
  LuTrendingUp,
  LuTriangleAlert,
  LuWallet,
} from "react-icons/lu";
import { baseUrl } from "@/main";
import { toaster } from "@/components/ui/toaster";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Passenger {
  name: string;
  phone: string;
}

interface Transaction {
  id: string;
  route: string;
  origin: string;
  destination: string;
  departure_datetime: string;
  seats: number;
  fare_amount: string;
  service_fee: string;
  commission_amount: string;
  driver_payout_amount: string;
  escrow_status: "none" | "locked" | "released" | "refunded";
  disbursement_status: string;
  released_at: string | null;
  no_show_at: string | null;
  created_at: string;
  passenger: Passenger | null;
}

interface Summary {
  released_amount: string;
  locked_amount: string;
  total_commission: string;
  total_service_fee: string;
  rides_completed: number;
  rides_locked: number;
  rides_refunded: number;
}

interface EarningsData {
  period: string;
  summary: Summary;
  transactions: Transaction[];
}

type Tab = "overview" | "history" | "payouts";
type Filter = "all" | "released" | "locked" | "refunded";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (val: string | number) =>
  Number(val).toLocaleString("en-US") + " RWF";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

// ── Sub-components ────────────────────────────────────────────────────────────

const StatusBadge = ({
  escrow,
}: {
  escrow: Transaction["escrow_status"];
}) => {
  if (escrow === "released")
    return (
      <Badge colorPalette="green" variant="subtle" borderRadius="full" px={2}>
        Paid out
      </Badge>
    );
  if (escrow === "locked")
    return (
      <Badge colorPalette="orange" variant="subtle" borderRadius="full" px={2}>
        Locked
      </Badge>
    );
  if (escrow === "refunded")
    return (
      <Badge colorPalette="red" variant="subtle" borderRadius="full" px={2}>
        Refunded
      </Badge>
    );
  return null;
};

const TxIcon = ({ escrow }: { escrow: Transaction["escrow_status"] }) => {
  if (escrow === "released")
    return (
      <Center
        w="34px"
        h="34px"
        borderRadius="lg"
        bg="green.50"
        _dark={{ bg: "green.950" }}
        flexShrink={0}
      >
        <Icon color="green.500" boxSize={4}>
          <LuCircleCheck />
        </Icon>
      </Center>
    );
  if (escrow === "locked")
    return (
      <Center
        w="34px"
        h="34px"
        borderRadius="lg"
        bg="orange.50"
        _dark={{ bg: "orange.950" }}
        flexShrink={0}
      >
        <Text fontSize="lg">🔒</Text>
      </Center>
    );
  if (escrow === "refunded")
    return (
      <Center
        w="34px"
        h="34px"
        borderRadius="lg"
        bg="red.50"
        _dark={{ bg: "red.950" }}
        flexShrink={0}
      >
        <Icon color="red.500" boxSize={4}>
          <LuTriangleAlert />
        </Icon>
      </Center>
    );
  return null;
};

const TxCard = ({ tx }: { tx: Transaction }) => (
  <Box
    bg="bg.panel"
    borderRadius="xl"
    p={4}
    borderWidth={1}
    borderColor="border"
    mb={2}
  >
    <Flex align="center" gap={3} minW={0}>
      <TxIcon escrow={tx.escrow_status} />
      <VStack align="start" gap={0} flex="1 1 0%" minW={0} w="full">
        <Text
          fontWeight="700"
          fontSize="sm"
          w="full"
          overflow="hidden"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
        >
          {tx.route}
        </Text>
        <Text fontSize="xs" color="fg.muted" w="full" overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">
          {fmtDate(tx.created_at)} · {tx.seats} seat{tx.seats !== 1 ? "s" : ""}
          {tx.passenger ? ` · ${tx.passenger.name}` : ""}
        </Text>
      </VStack>
      <VStack align="end" gap={0} flexShrink={0}>
        <Text
          fontWeight="700"
          fontSize="sm"
          color={
            tx.escrow_status === "released"
              ? "green.600"
              : tx.escrow_status === "refunded"
                ? "red.500"
                : "fg.muted"
          }
        >
          {tx.escrow_status === "refunded"
            ? "0 RWF"
            : `+${fmt(tx.driver_payout_amount)}`}
        </Text>
        <StatusBadge escrow={tx.escrow_status} />
      </VStack>
    </Flex>

    {tx.escrow_status === "released" && tx.released_at && (
      <Text fontSize="xs" color="fg.subtle" mt={2}>
        Disbursed at {fmtTime(tx.released_at)}
      </Text>
    )}
    {tx.escrow_status === "locked" && (
      <Box
        mt={2}
        bg="orange.50"
        _dark={{ bg: "orange.950" }}
        borderRadius="lg"
        px={3}
        py={2}
      >
        <Text fontSize="xs" color="orange.700" _dark={{ color: "orange.300" }}>
          Releases when you mark the destination as arrived
        </Text>
      </Box>
    )}
    {tx.escrow_status === "refunded" && (
      <Text fontSize="xs" color="red.500" mt={2}>
        Passenger reported no-show · No payout for this ride
      </Text>
    )}
  </Box>
);

// ── Overview tab ──────────────────────────────────────────────────────────────

const OverviewTab = ({
  summary,
  transactions,
}: {
  summary: Summary;
  transactions: Transaction[];
}) => (
  <VStack gap={4} align="stretch" pt={2}>
    {/* Summary cards */}
    <Box
      display="grid"
      gridTemplateColumns="1fr 1fr"
      gap={3}
    >
      <Box bg="bg.panel" borderRadius="xl" p={4} borderWidth={1} borderColor="border">
        <Text fontSize="xs" color="fg.muted" mb={1}>
          Paid out
        </Text>
        <Text fontSize="xl" fontWeight="800" color="green.600" lineHeight={1.1}>
          {fmt(summary.released_amount)}
        </Text>
        <Text fontSize="xs" color="fg.subtle">
          {summary.rides_completed} ride{summary.rides_completed !== 1 ? "s" : ""}
        </Text>
      </Box>
      <Box bg="bg.panel" borderRadius="xl" p={4} borderWidth={1} borderColor="border">
        <Text fontSize="xs" color="fg.muted" mb={1}>
          Locked 🔒
        </Text>
        <Text fontSize="xl" fontWeight="800" color="orange.500" lineHeight={1.1}>
          {fmt(summary.locked_amount)}
        </Text>
        <Text fontSize="xs" color="fg.subtle">
          {summary.rides_locked} in progress
        </Text>
      </Box>
      <Box bg="bg.panel" borderRadius="xl" p={4} borderWidth={1} borderColor="border">
        <Text fontSize="xs" color="fg.muted" mb={1}>
          Pamoja commission
        </Text>
        <Text fontSize="xl" fontWeight="800" color="fg.muted" lineHeight={1.1}>
          {fmt(summary.total_commission)}
        </Text>
        <Text fontSize="xs" color="fg.subtle">10% per ride</Text>
      </Box>
      <Box bg="bg.panel" borderRadius="xl" p={4} borderWidth={1} borderColor="border">
        <Text fontSize="xs" color="fg.muted" mb={1}>
          Refunded
        </Text>
        <Text fontSize="xl" fontWeight="800" color="red.500" lineHeight={1.1}>
          {summary.rides_refunded}
        </Text>
        <Text fontSize="xs" color="fg.subtle">no-shows</Text>
      </Box>
    </Box>

    {/* Recent transactions */}
    <Text fontWeight="700" fontSize="sm" color="fg.muted" textTransform="uppercase" letterSpacing="wider">
      Recent
    </Text>
    {transactions.slice(0, 5).map((tx) => (
      <TxCard key={tx.id} tx={tx} />
    ))}
    {transactions.length === 0 && (
      <Center py={10}>
        <VStack gap={2}>
          <Icon color="fg.subtle" boxSize={8}><LuTrendingUp /></Icon>
          <Text fontSize="sm" color="fg.muted">No earnings yet this month</Text>
        </VStack>
      </Center>
    )}
  </VStack>
);

// ── History tab ───────────────────────────────────────────────────────────────

const HistoryTab = ({ transactions }: { transactions: Transaction[] }) => {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = transactions.filter((tx) =>
    filter === "all" ? true : tx.escrow_status === filter,
  );

  const filters: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Paid out", value: "released" },
    { label: "Locked", value: "locked" },
    { label: "Refunded", value: "refunded" },
  ];

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  filtered.forEach((tx) => {
    const key = fmtDate(tx.created_at);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  });

  return (
    <VStack gap={4} align="stretch" pt={2}>
      <HStack gap={2} flexWrap="wrap">
        {filters.map((f) => (
          <Button
            key={f.value}
            size="xs"
            borderRadius="full"
            variant={filter === f.value ? "solid" : "outline"}
            colorPalette={filter === f.value ? "blue" : "gray"}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </HStack>

      {Object.entries(grouped).map(([date, txs]) => (
        <Box key={date}>
          <Text fontSize="xs" fontWeight="600" color="fg.muted" mb={2} textTransform="uppercase" letterSpacing="wider">
            {date}
          </Text>
          {txs.map((tx) => <TxCard key={tx.id} tx={tx} />)}
        </Box>
      ))}

      {filtered.length === 0 && (
        <Center py={10}>
          <Text fontSize="sm" color="fg.muted">No transactions match this filter</Text>
        </Center>
      )}
    </VStack>
  );
};

// ── Payouts tab ───────────────────────────────────────────────────────────────

const PayoutsTab = ({
  summary,
  transactions,
}: {
  summary: Summary;
  transactions: Transaction[];
}) => {
  const released = transactions.filter((tx) => tx.escrow_status === "released");
  const locked = transactions.filter((tx) => tx.escrow_status === "locked");

  return (
    <VStack gap={4} align="stretch" pt={2}>
      {/* Available balance */}
      <Box
        bg="green.50"
        _dark={{ bg: "green.950", borderColor: "green.800" }}
        borderRadius="2xl"
        p={5}
        borderWidth={1}
        borderColor="green.200"
      >
        <Text fontSize="xs" color="green.700" _dark={{ color: "green.300" }} mb={1}>
          Total paid out (this month)
        </Text>
        <Text fontSize="3xl" fontWeight="800" color="green.700" _dark={{ color: "green.300" }} lineHeight={1.1} mb={1}>
          {fmt(summary.released_amount)}
        </Text>
        <Text fontSize="xs" color="green.600" _dark={{ color: "green.400" }}>
          {summary.rides_completed} completed ride{summary.rides_completed !== 1 ? "s" : ""}
        </Text>
      </Box>

      {/* Locked */}
      {locked.length > 0 && (
        <Box bg="bg.panel" borderRadius="xl" p={4} borderWidth={1} borderColor="border">
          <HStack mb={2}>
            <Text fontSize="sm" fontWeight="700">
              🔒 Pending release
            </Text>
            <Badge colorPalette="orange" variant="subtle" borderRadius="full">
              {fmt(summary.locked_amount)}
            </Badge>
          </HStack>
          {locked.map((tx) => (
            <Flex key={tx.id} justify="space-between" align="center" gap={3} py={2} borderBottomWidth={1} borderColor="border" _last={{ borderBottom: "none" }}>
              <VStack align="start" gap={0} flex="1 1 0%" minW={0} w="full">
                <Text fontSize="xs" fontWeight="600" w="full" overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">{tx.route}</Text>
                <Text fontSize="xs" color="fg.muted">{fmtDate(tx.departure_datetime)}</Text>
              </VStack>
              <Text fontSize="sm" fontWeight="700" color="orange.500" flexShrink={0}>
                {fmt(tx.driver_payout_amount)}
              </Text>
            </Flex>
          ))}
          <Box mt={3} bg="orange.50" _dark={{ bg: "orange.950" }} borderRadius="lg" px={3} py={2}>
            <Text fontSize="xs" color="orange.700" _dark={{ color: "orange.300" }}>
              Funds release automatically when you mark each ride as arrived at the destination.
            </Text>
          </Box>
        </Box>
      )}

      <Separator />

      {/* Released history */}
      <Text fontWeight="700" fontSize="sm" color="fg.muted" textTransform="uppercase" letterSpacing="wider">
        Payout history
      </Text>
      {released.length === 0 && (
        <Center py={6}>
          <Text fontSize="sm" color="fg.muted">No payouts yet</Text>
        </Center>
      )}
      {released.map((tx) => (
        <Box key={tx.id} bg="bg.panel" borderRadius="xl" p={4} borderWidth={1} borderColor="border">
          <Flex justify="space-between" align="start" gap={3} mb={2}>
            <VStack align="start" gap={0} flex="1 1 0%" minW={0} w="full">
              <Text fontWeight="700" fontSize="sm" w="full" overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">{tx.route}</Text>
              <Text fontSize="xs" color="fg.muted">
                {tx.seats} seat{tx.seats !== 1 ? "s" : ""} · {tx.passenger?.name ?? "—"}
              </Text>
            </VStack>
            <Text fontWeight="800" fontSize="lg" color="green.600" flexShrink={0}>
              +{fmt(tx.driver_payout_amount)}
            </Text>
          </Flex>
          <Separator mb={2} />
          <HStack justify="space-between" fontSize="xs" color="fg.muted">
            <Text>Fare: {fmt(tx.fare_amount)}</Text>
            <Text>Commission: −{fmt(tx.commission_amount)}</Text>
          </HStack>
          {tx.released_at && (
            <Text fontSize="xs" color="fg.subtle" mt={1}>
              Disbursed {fmtDate(tx.released_at)} at {fmtTime(tx.released_at)} via MoMo
            </Text>
          )}
        </Box>
      ))}
    </VStack>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

export const EarningsPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [period, setPeriod] = useState<"month" | "all">("month");
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchEarnings = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await axios.get<EarningsData>(
        `${baseUrl}/payments/earnings/?period=${period}`,
        authHeader(),
      );
      setData(res.data);
    } catch {
      toaster.create({ title: "Failed to load earnings", type: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <LuTrendingUp /> },
    { key: "history", label: "History", icon: <LuClock /> },
    { key: "payouts", label: "Payouts", icon: <LuWallet /> },
  ];

  return (
    <Box minH="100vh" bg="bg">
      {/* Header */}
      <Box
        bgGradient="to-r"
        gradientFrom="blue.700"
        gradientTo="blue.500"
        pt="3rem"
        pb={6}
        px={4}
      >
        <Flex align="center" justify="space-between" mb={4}>
          <IconButton
            borderRadius="full"
            bg="blue.600"
            color="white"
            onClick={() => navigate(-1)}
          >
            <LuArrowLeft />
          </IconButton>
          <HStack gap={2}>
            <Button
              size="xs"
              borderRadius="full"
              variant={period === "month" ? "solid" : "outline"}
              bg={period === "month" ? "white" : "transparent"}
              color={period === "month" ? "blue.700" : "white"}
              borderColor="whiteAlpha.600"
              onClick={() => setPeriod("month")}
            >
              This month
            </Button>
            <Button
              size="xs"
              borderRadius="full"
              variant={period === "all" ? "solid" : "outline"}
              bg={period === "all" ? "white" : "transparent"}
              color={period === "all" ? "blue.700" : "white"}
              borderColor="whiteAlpha.600"
              onClick={() => setPeriod("all")}
            >
              All time
            </Button>
            <IconButton
              size="sm"
              borderRadius="full"
              bg="whiteAlpha.200"
              color="white"
              loading={refreshing}
              onClick={() => fetchEarnings(true)}
            >
              <LuRefreshCw />
            </IconButton>
          </HStack>
        </Flex>
        <Text fontWeight="800" fontSize="xl" color="white">
          Earnings
        </Text>
        {data && !loading && (
          <Text fontSize="sm" color="whiteAlpha.800" mt={1}>
            {fmt(data.summary.released_amount)} paid out ·{" "}
            {fmt(data.summary.locked_amount)} locked
          </Text>
        )}
      </Box>

      {/* Tabs */}
      <Box
        bg="bg.panel"
        borderBottomWidth={1}
        borderColor="border"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <HStack gap={0}>
          {tabs.map((t) => (
            <Button
              key={t.key}
              flex={1}
              variant="ghost"
              borderRadius={0}
              borderBottomWidth={2}
              borderColor={tab === t.key ? "blue.500" : "transparent"}
              color={tab === t.key ? "blue.600" : "fg.muted"}
              fontWeight={tab === t.key ? "700" : "500"}
              fontSize="sm"
              py={4}
              onClick={() => setTab(t.key)}
              gap={1.5}
            >
              <Icon boxSize={3.5}>{t.icon}</Icon>
              {t.label}
            </Button>
          ))}
        </HStack>
      </Box>

      <Container maxW="container.md" pb={24} pt={4}>
        {loading ? (
          <Center py={20}>
            <Spinner color="blue.500" size="lg" />
          </Center>
        ) : !data ? null : tab === "overview" ? (
          <OverviewTab summary={data.summary} transactions={data.transactions} />
        ) : tab === "history" ? (
          <HistoryTab transactions={data.transactions} />
        ) : (
          <PayoutsTab summary={data.summary} transactions={data.transactions} />
        )}
      </Container>
    </Box>
  );
};
