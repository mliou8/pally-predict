import TopBar from '../TopBar';

export default function TopBarExample() {
  const nextDrop = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

  return (
    <TopBar 
      alphaPoints={1020} 
      nextDropTime={nextDrop}
      onNotificationsClick={() => console.log('Notifications clicked')}
    />
  );
}
