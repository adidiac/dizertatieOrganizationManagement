# Introducere Generală și Analiză a Arhitecturii – Evaluarea Psihologică în Cybersecurity și Managementul Riscului

Acest document oferă o prezentare academică a întregii arhitecturi a sistemului, evidențiind modul în care diversele module (de la colectarea datelor HR până la simularea propagării atacurilor) se integrează pentru a evalua riscul cibernetic din perspectiva psihologică. Abordarea se bazează pe concepte din psihologia organizațională, învățarea automată și teoria rețelelor, conform literaturii de specialitate.

---

## 1. Context și Motivație

### 1.1. Importanța Psihologiei în Cybersecurity
Studiile din psihologia organizațională au demonstrat că factorii umani – precum nivelul de **awareness** (conștientizare), **conscientiousness** (conștiinciozitate), **stress**, **neuroticism** și **risk tolerance** (toleranța la risc) – joacă un rol critic în prevenirea și propagarea atacurilor cibernetice. Aceste trăsături influențează modul în care angajații respectă procedurile de securitate și reacționează în situații de criză.

### 1.2. Necesitatea unei Abordări Integrate
Într-un mediu organizațional complex, riscul nu poate fi evaluat doar la nivel individual, ci trebuie integrat cu factorii de mediu (de exemplu, vulnerabilitatea entităților IT) și relațiile dintre diferitele componente ale sistemului. Abordarea propusă combină:
- **Date HR și evaluări psihometrice**, pentru a obține un profil comportamental individual.
- **Analiza rețelelor** prin modelarea relațiilor ca un graf, pentru a identifica nodurile critice și căile de propagare a riscului.
- **Metode de învățare automată**, care oferă o evaluare predictivă a riscului și identifică anomalii.

---

## 2. State of the Art

### 2.1. Psihologia Organizațională și Cybersecurity
Literatura recentă (ex. Stajano & Wilson, 2006) subliniază că evaluarea trăsăturilor psihologice poate prezice comportamentele de risc. De exemplu:
- **Awareness** este esențial pentru prevenirea atacurilor de tip phishing.
- **Conscientiousness** este asociată cu respectarea procedurilor de securitate.
- **Stress** și **neuroticism** pot conduce la decizii greșite în situații critice.
- **Risk tolerance** determină predispoziția de a asuma riscuri în activități IT.

### 2.2. Tehnici de Învățare Automată și Teoria Rețelelor
- **Modele de clasificare (ex. regresie logistică):** Permite interpretarea factorilor care influențează riscul și oferă o bază solidă pentru predicții, conform lui Bishop (2006).
- **Algoritmi de clustering (ex. KMeans):** Ajută la segmentarea utilizatorilor în grupuri omogene, facilitând intervenții personalizate (Jain, 2010).
- **Teoria grafurilor:** Utilizarea NetworkX pentru modelarea rețelelor a fost documentată extensiv (Newman, 2010; Barabási, 2002) și permite analiza propagării atacurilor.

---

## 3. Arhitectura Sistemului și Fluxul de Date

### 3.1. Componente Principale
- **HR Data Proxy:**  
  - *Funcționalitate:* Interacționează cu API-ul HR pentru a obține informații despre persoane, entități, evaluări și relații.
  - *Beneficii:* Centralizează accesul la date și permite o manipulare uniformă a acestora.
  
- **Module de Extragere AI:**  
  - *Funcționalitate:* Utilizează metode variate (model bazat pe BERT, prompt engineering, servicii Azure) pentru a extrage evaluări psihometrice din texte.
  - *Beneficii:* Combină abordări complementare pentru a oferi rezultate robuste și adaptabile.

- **Risk Analysis:**  
  - *Funcționalitate:* Calculează scoruri de risc compozite pentru fiecare persoană, integrând evaluările individuale și impactul entităților asociate.
  - *Beneficii:* Permite o evaluare holistică, esențială pentru identificarea riscurilor în medii complexe.

- **Simularea Atacurilor și Construirea Grafului:**  
  - *Funcționalitate:* Utilizează NetworkX pentru a modela relațiile sub formă de graf și simulează propagarea unui atac prin algoritmi de parcurgere (BFS).
  - *Beneficii:* Identifică nodurile critice și căile de propagare, oferind informații pentru intervenții preventive.

- **Clustering și Detectarea Anomaliilor:**  
  - *Funcționalitate:* Grupează evaluările în clustere și identifică anomalii folosind algoritmi precum KMeans și IsolationForest.
  - *Beneficii:* Permite segmentarea utilizatorilor pe baza comportamentelor similare și detectarea valorilor atipice pentru acțiuni corective.

- **API REST:**  
  - *Funcționalitate:* Expune toate funcționalitățile sistemului (evaluare, simulare, predicție, clustering) prin endpoint-uri, facilitând integrarea cu dashboard-ul și alte aplicații.
  - *Beneficii:* Permite interoperabilitatea și accesul centralizat la date și analize.

### 3.2. Fluxul de Date
1. **Colectare și Preprocesare:**  
   Datele sunt extrase prin HR Data Proxy și preprocesate pentru a fi utilizate în calculele de risc.
2. **Calculul Riscului:**  
   Evaluările psihometrice sunt procesate în `risk_analysis.py` pentru a obține scoruri compozite.
3. **Construirea Grafului:**  
   Funcția `build_risk_graph` din `simulate_attack.py` creează un graf care reprezintă relațiile dintre persoane și entități.
4. **Simularea Atacurilor:**  
   Funcția `simulate_attack` parcurge graful pentru a simula propagarea unui atac, pe baza unui prag de risc.
5. **Expunerea prin API:**  
   Endpoint-urile REST permit accesul la evaluări, simulări, predicții și grafuri, facilitând integrarea cu dashboard-ul.

---

## 4. Concluzii și Perspective

### 4.1. Concluzii
Arhitectura prezentată combină evaluările psihometrice cu analiza relațiilor organizaționale pentru a oferi o abordare integrată în managementul riscului cibernetic. Prin utilizarea tehnicilor de învățare automată (regresie logistică, clustering) și a teoriei grafurilor, sistemul permite:
- O evaluare holistică a riscului la nivel individual și de rețea.
- Simularea propagării atacurilor, identificând nodurile critice pentru intervenție.
- Detectarea anomaliilor și segmentarea utilizatorilor, oferind suport decizional pentru politici de securitate adaptate.

### 4.2. Perspective Viitoare și Posibile Îmbunătățiri
- **Extinderea Metodelor de Clustering și Analiză a Rețelelor:**  
  Se pot integra algoritmi avansați, cum ar fi Graph Neural Networks (GNN), pentru a capta relațiile non-liniare și complexitatea rețelelor organizaționale.
- **Optimizarea Modelului de Clasificare:**  
  Utilizarea unor tehnici de validare încrucișată și optimizarea hyperparametrilor pentru a îmbunătăți performanța predicțiilor.
- **Integrarea Altora Factori:**  
  Adăugarea de noi variabile, cum ar fi istoricul incidentelor sau nivelul de instruire în securitate, pentru a obține o evaluare mai precisă a riscului.
- **Vizualizări Avansate:**  
  Dezvoltarea unui dashboard interactiv care să includă vizualizări grafice (ex. Force-Graph) pentru reprezentarea relațiilor și propagării atacurilor, facilitând astfel interpretarea datelor de către decidenți.

---

## 5. State of the Art

### 5.1. Psihologia și Securitatea Cibernetică
Studiile recente din domeniul psihologiei organizaționale (ex. Stajano & Wilson, 2006) subliniază importanța evaluării trăsăturilor individuale pentru a anticipa comportamentele de risc în securitatea cibernetică. Integrarea acestor trăsături în modelele predictive este considerată o abordare inovatoare, care combină datele comportamentale cu tehnicile moderne de învățare automată.

### 5.2. Tehnici de Învățare Automată și Teoria Rețelelor
- **Modele Clasice vs. Modele Avansate:**  
  Deși regresia logistică și KMeans reprezintă puncte de plecare solide (Bishop, 2006; Jain, 2010), cercetările actuale explorează și modele non-liniare și rețele neuronale, precum și algoritmi de analiză a rețelelor (Newman, 2010; Barabási, 2002), pentru a captura interdependențele complexe din datele organizaționale.
- **Detectarea Anomaliilor:**  
  Utilizarea algoritmului IsolationForest (Liu et al., 2008) este considerată o metodă de ultimă oră pentru identificarea valorilor atipice, datorită eficienței sale și a capacității de a funcționa fără a presupune o distribuție specifică a datelor.
