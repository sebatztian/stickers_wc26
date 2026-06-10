"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondToTrade } from "@/lib/actions/trades";
import { Button } from "@/components/ui/Button";

interface Props {
  tradeId: string;
  isInitiator: boolean;
}

export function TradeActions({ tradeId, isInitiator }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function act(action: "accept" | "reject" | "cancel") {
    startTransition(async () => {
      await respondToTrade(tradeId, action);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-3 flex-wrap">
      {isInitiator ? (
        <Button variant="danger" size="md" onClick={() => act("cancel")} disabled={isPending}>
          Cancel Trade
        </Button>
      ) : (
        <>
          <Button variant="primary" size="md" onClick={() => act("accept")} disabled={isPending}>
            Accept Trade
          </Button>
          <Button variant="danger" size="md" onClick={() => act("reject")} disabled={isPending}>
            Reject Trade
          </Button>
        </>
      )}
    </div>
  );
}
