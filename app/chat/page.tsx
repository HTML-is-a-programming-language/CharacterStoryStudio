import { getChatCharacter, getNextSuggestedUserLine } from "../../src/pipeline/chatPipeline";
import { ChatClient } from "./ChatClient";

export default function ChatPage() {
  const character = getChatCharacter();
  const initialSuggestedLine = getNextSuggestedUserLine([]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm uppercase tracking-widest text-white/50">Character Story Studio · Demo</p>
      <h1 className="mt-2 text-3xl font-bold">{character.name}와(과) 채팅하기</h1>
      <p className="mt-3 max-w-xl text-xs text-white/40">
        이 데모는 정해진 대화 흐름을 따라갑니다. 실제 LLM이 이해하고 답하는 게 아니라, 무엇을
        보내든 {character.name}의 답장은 항상 같은 대본을 따릅니다(Mock).
      </p>
      <p className="mt-6 text-sm italic text-white/50">
        비 오는 저녁, 도서관. {character.name}가 책을 정리하고 있다.
      </p>

      <ChatClient characterName={character.name} initialSuggestedLine={initialSuggestedLine} />
    </main>
  );
}
