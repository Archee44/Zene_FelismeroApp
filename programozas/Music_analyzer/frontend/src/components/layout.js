import { AppShell, Group, Button, Text, ActionIcon, useMantineColorScheme } from "@mantine/core";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { IconHome, IconMusic, IconSearch, IconSun, IconMoonStars } from "@tabler/icons-react";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  const handleClick = (to) => {
    if (location.pathname === to) {
      navigate(0);
    }
  };

  return (
    <AppShell
      header={{ height: 80 }}
      padding="40"
      style={{
        background: dark ? "linear-gradient( #1A1B1E )" : "linear-gradient(180deg, #FFFF 0%, #FFF8E7 100%)",
        minHeight: "100vh",
        color: dark ? "#ffff" : "#000",
      }}
    >
      <AppShell.Header
        style={{
          boxShadow: "0px 5px 10px 0px rgba(82, 63, 105, 0.05)",
          backgroundColor: dark ? "#0C1A2A" : "#FFF8E7",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "100%",
            padding: "0 20px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/icons/New_MeloDive.png" alt="Logo" style={{ height: 50 }} />
            <Text
              style={{
                fontSize: 30,
                fontWeight: "bold",
                color: dark ? "#fff" : "#0C1A2A",
              }}
            >
              MeloDive
            </Text>
          </div>

          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <Group>
              <Button
                component={Link}
                to="/"
                variant="filled"
                size="md"
                leftSection={<IconHome size={14} />}
                style={{ transition: "transform 0.2s", backgroundColor: dark ? "#483d8b" : "#FFD966", color: dark ? "#FFFFFF" : "#0C1A2A"}}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                onClick={() => handleClick("/")}
              >
                Főoldal
              </Button>

              <Button
                component={Link}
                to="/music-analyzer"
                variant="filled"
                size="md"
                leftSection={<IconMusic size={14} />}
                style={{ transition: "transform 0.2s", backgroundColor: dark ? "#483d8b" : "#FFD966", color: dark ? "#FFFFFF" : "#0C1A2A"}}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                onClick={() => handleClick("/music-analyzer")}
              >
                Elemzés
              </Button>

              <Button
                component={Link}
                to="/lyrics-search"
                variant="filled"
                size="md"
                leftSection={<IconSearch size={14} />}
                style={{ transition: "transform 0.2s", backgroundColor: dark ? "#483d8b" : "#FFD966", color: dark ? "#FFFFFF" : "#0C1A2A"}}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                onClick={() => handleClick("/lyrics-search")}
              >
                Zene Keresés
              </Button>
            </Group>
          </div>

          <ActionIcon
            onClick={toggleColorScheme}
            variant="light"
            size="lg"
            radius="xl"
            title="Téma váltása"
          >
            {dark ? <IconSun size={20} /> : <IconMoonStars size={20} />}
          </ActionIcon>
        </div>
      </AppShell.Header>

      <main
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 80px)",
          paddingTop: 70,
          
        }}>
        <Outlet />
      </main>
    </AppShell>
  );
}