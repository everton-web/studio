import { Hero } from "@/components/Hero";
import { Mama } from "@/components/Mama";
import { Cuidado } from "@/components/Cuidado";
import { Rpp } from "@/components/Rpp";
import { Estrutura } from "@/components/Estrutura";
import { Equipe } from "@/components/Equipe";
import { Contato } from "@/components/Contato";

export default function Home() {
  return (
    <>
      <Hero />
      <Mama />
      <Cuidado />
      <Rpp />
      <Estrutura />
      <Equipe />
      <Contato />
    </>
  );
}
