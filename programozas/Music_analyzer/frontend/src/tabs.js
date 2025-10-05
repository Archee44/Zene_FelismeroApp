import { Tabs } from '@mantine/core';
import { IconPhoto, IconMessageCircle, IconSettings, IconMusic } from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';

function Demo() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = location.pathname === '/music-analyzer' ? 'music' : 'gallery';

  return (
    <Tabs
      value={activeTab}
      onChange={(value) => {
        if (value === 'music') navigate('/music-analyzer');
        else if (value === 'gallery') navigate('/');
      }}
      variant="outline"   // 🔹 makes it styled like Mantine demo
      radius="md"
    >
      <Tabs.List>
        <Tabs.Tab value="gallery" leftSection={<IconPhoto size={14} />}>
          Gallery
        </Tabs.Tab>
        <Tabs.Tab value="messages" leftSection={<IconMessageCircle size={14} />}>
          Messages
        </Tabs.Tab>
        <Tabs.Tab value="settings" leftSection={<IconSettings size={14} />}>
          Settings
        </Tabs.Tab>
        <Tabs.Tab value="music" leftSection={<IconMusic size={14} />}>
          Music Analyzer
        </Tabs.Tab>
      </Tabs.List>
    </Tabs>
  );
}

export default Demo;
