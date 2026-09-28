import Link from "next/link";
import { TrocarShell } from "@/components/trocar/shell";
import { APP_NAME, PILOT_BARRIOS, ROUTES } from "@/constants/routes";

export default function TermsPage() {
  return (
    <TrocarShell
      rightSlot={
        <Link
          href={ROUTES.register}
          className="text-sm text-white/80 hover:text-white"
        >
          Crear cuenta
        </Link>
      }
    >
      <main className="trocar-fade-up space-y-8 pb-16">
        <header className="space-y-2">
          <p className="text-xs tracking-wide text-trocar-mute uppercase">
            Vigente desde el 22 de septiembre de 2026
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            Términos y condiciones
          </h1>
          <p className="text-sm text-trocar-mute">
            Estos términos regulan el uso de {APP_NAME}, un espacio para
            proponer intercambios entre vecinos.
          </p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-trocar-mute">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-trocar-paper">
            1. Qué es {APP_NAME}
          </h2>
          <p>
            {APP_NAME} permite publicar objetos o servicios y proponer un
            trueque con otra persona. El encuentro y el intercambio los
            coordinan quienes participan. {APP_NAME} no compra, no vende y no
            custodia lo que se intercambia.
          </p>
          <p>
            El piloto está pensado para estos barrios: {PILOT_BARRIOS.join(", ")}.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-trocar-mute">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-trocar-paper">
            2. La cuenta
          </h2>
          <p>
            Para publicar o proponer un intercambio necesitás una cuenta con
            datos verdaderos: nombre, correo y barrio. Sos responsable de
            mantener la contraseña en privado y de lo que se haga desde tu
            cuenta.
          </p>
          <p>
            Tenés que ser mayor de 18 años. Una persona, una cuenta. Podemos
            suspender una cuenta si se usa para suplantar a alguien, para spam
            o para incumplir estos términos.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-trocar-mute">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-trocar-paper">
            3. Publicaciones y propuestas
          </h2>
          <p>
            Solo publicá cosas que podés entregar y servicios que podés
            cumplir. La descripción tiene que ser clara. No está permitido
            ofrecer bienes ilegales, peligrosos, robados o que no te
            pertenezcan, ni servicios que requieran una matrícula que no
            tengas.
          </p>
          <p>
            Una propuesta no obliga a cerrar el trueque. Cualquiera de las dos
            partes puede rechazarla o contraofertarla. El intercambio queda
            concretado cuando ambas personas lo confirman en la app.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-trocar-mute">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-trocar-paper">
            4. Encuentros
          </h2>
          <p>
            El lugar y el horario los acuerdan las personas por el chat. Elegí
            un espacio público y revisá el objeto o el servicio antes de
            confirmar. {APP_NAME} no intermedia el encuentro ni responde por
            daños, pérdidas, incumplimientos o desacuerdos entre vecinos.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-trocar-mute">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-trocar-paper">
            5. Créditos y calificaciones
          </h2>
          <p>
            Los Créditos Vecinales y las estrellas son una señal de confianza
            dentro de {APP_NAME}. No son dinero, no se canjean por efectivo y
            no se transfieren fuera de la plataforma. Calificá con honestidad
            y solo después de un trueque concretado.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-trocar-mute">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-trocar-paper">
            6. Conducta
          </h2>
          <p>
            Tratá al resto con respeto. No uses el chat para acosar, insultar,
            pedir datos sensibles ni mandar publicidad. No publiques datos de
            otra persona sin su acuerdo.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-trocar-mute">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-trocar-paper">
            7. Datos
          </h2>
          <p>
            Guardamos lo necesario para que la cuenta y los intercambios
            funcionen: nombre, correo, barrio, publicaciones, mensajes,
            calificaciones y créditos. El perfil público muestra nombre,
            barrio, bio, publicaciones activas y reputación. Podés pedir la
            baja de tu cuenta escribiendo al contacto de {APP_NAME}.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-trocar-mute">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-trocar-paper">
            8. Cambios
          </h2>
          <p>
            Podemos actualizar estos términos si el piloto cambia. La versión
            vigente es la publicada en esta página. Seguir usando {APP_NAME}
            después de un cambio implica aceptar la versión nueva.
          </p>
        </section>
      </main>
    </TrocarShell>
  );
}
