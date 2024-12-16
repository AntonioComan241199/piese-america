import React from "react";
import { Container } from "react-bootstrap";

const TermsAndConditions = () => {
  return (
    <Container className="py-5">
      <h1 className="text-center mb-4">Termeni și Condiții</h1>

      <section className="mb-4">
        <h2 className="h5">1. Introducere</h2>
        <p>
          Folosirea acestui site (plasarea cererilor de ofertă sau utilizarea altor funcționalități) implică acceptarea următorilor termeni și condiții. Vă recomandăm să citiți cu atenție toate informațiile furnizate înainte de a utiliza site-ul.
        </p>
        <p>
          <strong>SC Global Quality Solutions SRL</strong> își rezervă dreptul de a modifica acești termeni și condiții fără o notificare prealabilă. Versiunea actualizată a acestora va fi disponibilă pe site.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="h5">2. Drepturi de autor</h2>
        <p>
          Întregul conținut al site-ului <strong>www.pieseautoamerica.ro</strong> (imagini, texte, grafice, simboluri, elemente de grafică web, scripturi, programe etc.) este proprietatea <strong>SC Global Quality Solutions SRL</strong> și este protejat de legislația privind drepturile de autor.
        </p>
        <p>
          Utilizarea fără acordul nostru a oricăror elemente enumerate mai sus se pedepsește conform legilor în vigoare.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="h5">3. Securitatea datelor personale</h2>
        <p>
          <strong>SC Global Quality Solutions SRL</strong> respectă legislația în vigoare privind protecția datelor cu caracter personal. Datele colectate sunt utilizate strict pentru scopurile specificate, cum ar fi:
        </p>
        <ul>
          <li>Procesarea cererilor de ofertă și comunicarea cu clienții.</li>
          <li>Facturarea serviciilor și identificarea utilizatorilor.</li>
        </ul>
        <p>
          Conform legislației, aveți dreptul de a accesa, corecta sau solicita ștergerea datelor personale. Pentru orice solicitare, ne puteți contacta utilizând formularul din pagina de <strong>Contact</strong>.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="h5">4. Utilizarea platformei</h2>
        <p>
          Acest site este destinat exclusiv solicitării de oferte pentru piese auto. <strong>SC Global Quality Solutions SRL</strong> nu deține un catalog de produse online și nu garantează disponibilitatea imediată a pieselor solicitate.
        </p>
        <ol>
          <li>Utilizatorii pot plasa cereri de ofertă prin completarea unui formular dedicat.</li>
          <li>După analizarea cererii, vă vom contacta prin email sau telefon pentru detalii suplimentare.</li>
          <li>Acceptarea ofertei de către client se face printr-un răspuns explicit transmis către noi.</li>
        </ol>
      </section>

      <section className="mb-4">
        <h2 className="h5">5. Limitare de responsabilitate</h2>
        <p>
          SC Global Quality Solutions SRL nu garantează că:
        </p>
        <ul>
          <li>Informațiile afișate pe site sunt complet exacte sau fără erori.</li>
          <li>Serviciile platformei vor fi disponibile permanent sau fără întreruperi.</li>
        </ul>
        <p>
          Nu suntem responsabili pentru:
        </p>
        <ul>
          <li>Orice daune directe sau indirecte cauzate de utilizarea platformei.</li>
          <li>Probleme de compatibilitate tehnică între dispozitivele utilizatorilor și platforma noastră.</li>
        </ul>
      </section>

      <section className="mb-4">
        <h2 className="h5">6. Politica de anulare și rambursare</h2>
        <p>
          În cazul în care clientul decide să anuleze solicitarea înainte de transmiterea unei oferte, aceasta poate fi anulată fără nicio obligație.
        </p>
        <p>
          Dacă a fost acceptată o ofertă și s-a realizat o plată, termenii de anulare și rambursare vor fi clar specificați în contractul de vânzare-cumpărare.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="h5">7. Rezolvarea litigiilor</h2>
        <p>
          Orice conflict între client și <strong>SC Global Quality Solutions SRL</strong> va fi soluționat pe cale amiabilă. Dacă acest lucru nu este posibil, litigiile vor fi soluționate de instanțele competente din România.
        </p>
      </section>

      <section>
        <h2 className="h5">8. Contact</h2>
        <p>
          Pentru întrebări sau nelămuriri legate de acești termeni și condiții, ne puteți contacta prin:
        </p>
        <ul>
          <li>Email: <strong>costel.barbu@artri.ro</strong></li>
          <li>Telefon: <strong>0740 121 689</strong></li>
          <li>Formularul din pagina <strong>Contact</strong>.</li>
        </ul>
      </section>
    </Container>
  );
};

export default TermsAndConditions;
