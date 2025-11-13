'use client';

import { GameStoreProvider } from './game-store-context';

export function GameStoreClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GameStoreProvider>{children}</GameStoreProvider>;
}
