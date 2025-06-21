# Documentație Academică Detaliată – Antrenarea Modelului de Atac și Dashboard

Această documentație oferă o analiză detaliată a modulului de antrenare a modelului de atac și a componentelor dashboard-ului aferent. Vom examina pe părți codul, bibliotecile folosite, argumentele și interdependențele acestora, motivând fiecare alegere pe baza literaturii de specialitate și a bunelor practici din domeniul învățării automate și al vizualizării datelor.

---

## 1. Introducere

În mediul cybersecurity, evaluarea riscului prin analiza trăsăturilor psihometrice este o abordare modernă ce combină metode de învățare automată cu concepte din psihologia organizațională. Acest proiect are două componente principale:

1. **Modulul de Antrenare a Modelului de Atac**  
   - Generarea datelor sintetice pentru a simula variabile psihometrice.
   - Antrenarea unui model de clasificare multiclasă (regresie logistică) pentru a prezice tipul de atac la care este expus un individ.
   - Salvarea modelului antrenat pentru utilizări ulterioare.

2. **Dashboard-ul de Vizualizare**  
   - Integrarea datelor extrase și rezultatelor modelului într-o interfață interactivă.
   - Vizualizarea evaluărilor psihometrice și a segmentării (clustering) pentru a oferi o imagine de ansamblu asupra riscurilor comportamentale în cadrul organizației.

Această documentație detaliată explică de ce s-au ales aceste metode, ce beneficii aduc și cum se influențează reciproc componentele sistemului.

---

## 2. Modulul de Antrenare a Modelului de Atac (`train_attack_model.py`)

### 2.1. Generarea Datelor Sintetice

#### Ce face:
- **Funcția `generate_synthetic_attack_data`**:
  - Folosește `numpy` pentru a genera `n_samples` eșantioane.
  - Pentru fiecare eșantion, generează valori ale atributelor (awareness, conscientiousness, stress, neuroticism, risk_tolerance, connectivity) într-un interval definit (majoritatea în intervalul [0, 1]).  
  - Simulează scoruri pentru diferite tipuri de atac (phishing, social engineering, ransomware) folosind formule liniare cu coeficienți arbitrari și adăugând zgomot gaussian.
  - Alege eticheta atacului pentru fiecare eșantion în funcție de cel mai mare scor, aplicând un prag: dacă cel mai mare scor este sub 0, eticheta este „none”.

#### De ce s-a ales:
- **Simulare Experimentală:**  
  Datele sintetice permit simularea unui mediu controlat pentru testarea modelelor, înainte de a aplica soluția pe date reale. Literatura de specialitate (Bishop, 2006) evidențiază utilitatea simulărilor pentru validarea preliminară a algoritmilor.
- **Controlul Variabilității:**  
  Parametrii precum `n_samples` și `random_state` oferă control asupra variabilității datelor, facilitând reproducibilitatea experimentelor.

#### Beneficii:
- **Flexibilitate:** Permite ajustarea rapidă a volumului de date și a distribuțiilor.
- **Testare Inițială:** Oferă un cadru pentru testarea și evaluarea algoritmului de clasificare fără a depinde de date reale.

#### Posibile îmbunătățiri:
- **Data Augmentation:** Se pot utiliza tehnici de augmentare a datelor pentru a simula mai fidel complexitatea mediului real.
- **Corelații între Atribute:** Introducerea corelațiilor între variabile ar putea reflecta mai bine interdependențele din viața reală.

---

### 2.2. Antrenarea Modelului de Clasificare

#### Ce face:
- **Extracția Caracteristicilor (X) și a Etichetelor (y):**  
  Din DataFrame-ul generat se extrag atributele (X) și etichetele de atac (y).

- **Împărțirea Setului de Date:**  
  Se folosește `train_test_split` (din scikit-learn) pentru a împărți datele în 80% antrenament și 20% testare. Această abordare este standard în învățarea automată pentru a evalua performanța pe date nevăzute.

- **Antrenarea Modelului:**  
  Se utilizează `LogisticRegression` configurată pentru clasificare multiclasă (`multi_class='multinomial'`) cu solver-ul `lbfgs` și un număr maxim de iterații (`max_iter=1000`), pentru a asigura convergența.  
  Coeficienții modelului determină influența fiecărui atribut asupra probabilității de apariție a unui anumit tip de atac.

- **Evaluarea Performanței:**  
  Se folosește `classification_report` pentru a calcula măsuri precum precizia, recall-ul și scorul F1, oferind o evaluare cuprinzătoare a performanței modelului pe setul de test.

#### De ce s-a ales:
- **Regresie Logistică Multiclasă:**  
  Acest algoritm este bine documentat, ușor de interpretat și eficient pe seturi de date de dimensiuni moderate. Literatura (Bishop, 2006) recomandă regresia logistică ca punct de plecare pentru probleme de clasificare datorită simplității și robustetei sale.
- **Solver-ul lbfgs:**  
  Este adecvat pentru probleme de optimizare de dimensiuni medii și asigură o convergență rapidă.
- **Split-ul Setului de Date:**  
  Asigură evaluarea robustă și previne overfitting-ul, o practică standard în metodologia de învățare automată.

#### Beneficii:
- **Interpretabilitate:** Modelele liniare permit interpretarea coeficienților pentru a înțelege influența fiecărui atribut.
- **Eficiență Computațională:** Metoda este rapidă și scalabilă pentru seturi de date moderate.
- **Evaluare Transparentă:** Măsurile de performanță oferite de `classification_report` ajută la diagnosticarea eventualelor probleme de generalizare.

#### Posibile îmbunătățiri:
- **Modele Non-liniare:** Explorarea modelelor precum arborii de decizie, SVM sau rețelele neuronale pentru a captura relații non-liniare.
- **Optimizarea Hyperparametrilor:** Folosirea tehnicilor de grid search sau random search pentru a optimiza parametrii modelului.
- **Validare încrucișată:** Implementarea k-fold cross-validation pentru a asigura o estimare mai robustă a performanței.

---

### 2.3. Salvarea Modelului

#### Ce face:
- Modelul antrenat este serializat și salvat în fișierul `attack_model.pkl` folosind `pickle`. De asemenea, fișierul salvează modelul pentru reutilizare ulterioară fără reantrenare.

#### De ce s-a ales:
- **Persistența și Reutilizarea:**  
  Salvarea modelului permite integrarea acestuia în alte componente (precum modulul de predicție) și asigură portabilitatea între diverse medii de execuție.
- **Compatibilitate:**  
  `pickle` este o soluție standard în Python pentru serializarea obiectelor.

#### Beneficii:
- Economisește timp și resurse, eliminând nevoia reantrenării modelului pentru fiecare execuție.
- Permite implementarea rapidă a modelului în producție.

#### Posibile îmbunătățiri:
- **Utilizarea `joblib`:** Poate fi mai eficient pentru obiecte mari care conțin matrice NumPy.
- **Format ONNX:** Pentru interoperabilitate între diferite framework-uri și platforme de producție.

---

## 3. Modulul de Predicție a Riscului de Atac (`predict_attack_risk.py`)

### 3.1. Funcționalitate

#### Ce face:
- **Încărcarea Modelului:**  
  Funcția `load_model` verifică existența fișierului de model și îl încarcă folosind `pickle`.
- **Predicția Riscului:**  
  Funcția `predict_attack_risk` primește un vector de 6 atribute în ordinea:  
  `[awareness, conscientiousness, stress, neuroticism, risk_tolerance, connectivity]`  
  și un tip de atac (de ex. "phishing", "social_engineering", "ransomware" sau "none").  
  Modelul preîncărcat este folosit pentru a calcula probabilitățile pentru fiecare clasă, iar funcția returnează probabilitatea corespunzătoare tipului specificat.

#### De ce s-a ales:
- **Separarea Logicii:**  
  Separarea funcției de predicție de antrenare permite reutilizarea modelului într-o manieră modulară.
- **Predict_proba:**  
  Utilizarea metodei `predict_proba` asigură obținerea probabilităților pentru fiecare clasă, ceea ce oferă o măsură a incertitudinii predicției.
- **Robustețe:**  
  Verificarea existenței fișierului de model previne erorile la runtime.

#### Beneficii:
- Integrarea facilă cu API-ul de risk management.
- Permite evaluarea riscului la nivel individual, bazat pe valorile extrase din evaluările psihometrice.

#### Posibile îmbunătățiri:
- **Validări suplimentare:** Adăugarea de verificări suplimentare pentru validitatea datelor de intrare.
- **Actualizarea modelului:** Periodic, modelul ar putea fi reantrenat sau recalibrat pe date noi pentru a îmbunătăți performanța.

---

## 4. Dashboard-ul de Vizualizare

### 4.1. Scop și Funcționalitate

Dashboard-ul oferă o interfață interactivă pentru vizualizarea:
- Rezultatelor clustering-ului, care grupează utilizatorii/entitățile pe baza evaluărilor psihometrice.
- Evaluărilor psihometrice detaliate pentru fiecare individ.

### 4.2. Implementare și Biblioteci Utilizate

- **React:** Pentru crearea interfeței web dinamice.
- **Material UI:** Pentru componentele vizuale (tabele, carduri, butoane) care asigură o prezentare modernă și consistentă.
- **Fetch API:** Pentru a face apeluri către endpoint-urile REST ale backend-ului și a obține date în format JSON.

### 4.3. Componente Cheie ale Dashboard-ului

- **Rezultate Clustering:**  
  Dashboard-ul afișează clusterele obținute de la endpoint-ul `/api/clustering`, permițând utilizatorului să vadă grupurile de utilizatori cu profiluri similare. Aceste clustere sunt prezentate într-un format listă, cu informații esențiale (ex. nume, departament, tipul entității).

- **Evaluări Psihometrice:**  
  Un tabel interactiv afișează evaluările psihometrice ale utilizatorilor, inclusiv valorile pentru awareness, conscientiousness, stress, neuroticism și risk_tolerance. Acest tabel ajută la identificarea rapidă a persoanelor cu risc ridicat.

- **Actualizare și Reîmprospătare:**  
  Butoanele de reîmprospătare permit actualizarea datelor în timp real, integrând noi evaluări sau rezultate de clustering.

### 4.4. Interdependențe și Flux de Date

- **Fluxul de Date:**  
  1. **Backend:** Datele sunt generate, prelucrate și stocate de modulele de antrenare și evaluare.
  2. **API:** Endpoint-urile REST (ex. `/api/graph`, `/api/psychometric_assessments`) expun datele către frontend.
  3. **Frontend (Dashboard):** Apelurile API sunt realizate folosind Fetch API, iar datele primite sunt afișate în tabele și carduri.
  
- **Argumente Importante:**  
  - **n_samples:** Controlează volumul de date sintetice generate.
  - **random_state:** Asigură reproducibilitatea datelor și a antrenamentului modelului.
  - **n_clusters:** În clustering, determină numărul de grupuri; influențează granularitatea segmentării.
  - **Threshold-ul:** În simularea atacului, stabilește pragul de risc peste care un nod este considerat compromis.
  - **Max_iter:** În LogisticRegression, definește numărul maxim de iterații pentru convergență.

Aceste argumente influențează direct performanța, stabilitatea și interpretabilitatea modelului și a analizei de clustering.

---

## 5. Concluzii și Perspective Viitoare

Modulul de antrenare a modelului de atac și dashboard-ul aferent reprezintă componente esențiale pentru evaluarea riscului în cybersecurity, bazate pe date psihometrice. Alegerea regresiei logistice multiclasă, generarea de date sintetice și utilizarea unor tehnici de clustering (KMeans) sunt susținute de literatura de specialitate (Bishop, 2006; Jain, 2010) și oferă o bază solidă pentru analiza comportamentală.

### Posibile îmbunătățiri:
- **Extinderea modelelor de clasificare:** Utilizarea unor modele non-liniare sau rețele neuronale pentru a captura relații complexe între atribute.
- **Optimizarea hyperparametrilor:** Implementarea validării încrucișate și a tehnicilor de optimizare a parametrilor pentru a îmbunătăți performanța modelului.
- **Vizualizări avansate:** Integrarea unor vizualizări grafice (ex. Force-Graph) în dashboard pentru a reprezenta relațiile dintre utilizatori și entități.
- **Feedback continuu:** Adaptarea continuă a modelului pe baza datelor reale colectate în timp, pentru a menține relevanța predicțiilor.

---

## 6. Referințe

1. **Bishop, C. M. (2006).** *Pattern Recognition and Machine Learning.* Springer.
2. **Jain, A. K. (2010).** *Data Clustering: 50 Years Beyond K-Means.* Pattern Recognition Letters.
3. **Devlin, J., Chang, M. W., Lee, K., & Toutanova, K. (2018).** *BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding.* arXiv preprint.
4. Studii recente în psihologia organizațională privind influența trăsăturilor psihometrice în comportamentul de risc.

---

Această documentație detaliată oferă o perspectivă completă asupra modului în care componentele de antrenare a modelului și dashboard-ul interactiv sunt concepute și integrate pentru a evalua riscul de atac în cybersecurity, justificând deciziile metodologice prin referințe academice și evidențiind posibile direcții de îmbunătățire.


# Part 2 

# Documentație Academică – Modulul Risk Analysis

Acest modul (risk_analysis.py) este esențial în cadrul aplicației, deoarece furnizează o metodă de calcul a unui scor compozit de risc pentru fiecare persoană. Scorul compozit de risc este obținut prin combinarea a două componente majore:  
1. **Riscul psihometric** – derivat din analiza caracteristicilor individuale (awareness, conscientiousness, stress, neuroticism, risk_tolerance) printr-un model AI.  
2. **Riscul entităților** – calculat pe baza vulnerabilităților entităților asociate (ex.: servere, stații de lucru etc.), ponderate printr-o măsură a "conectivității" sau centralității acestora.

Această abordare combinată reflectă ideea că atât trăsăturile individuale, cât și factorii externi (entitățile cu care o persoană interacționează) contribuie la riscul global de atac cibernetic. Mai jos este prezentată o analiză detaliată a fiecărei funcționalități, cu argumente academice și referințe din literatură.

---

## 1. Funcția `compute_composite_risk_for_person`

### 1.1. Obiectiv și Funcționalitate

- **Scop:**  
  Calculează un scor compozit de risc pentru o persoană, integrând:
  - **Riscul psihometric:** Estimat pe baza unui model AI (prin funcția `predict_attack_risk`).
  - **Riscul entităților:** Calculat prin agregarea contribuțiilor din entitățile asociate, fiecare contribuție fiind o funcție de vulnerabilitate și "conectivitate".

- **Fluxul de Calcul:**
  1. **Preprocesarea Atributelor:**  
     Din dicționarul `assessment` se extrag valorile pentru cele cinci atribute esențiale și se adaugă un parametru suplimentar `connectivity`. Dacă valoarea de conectivitate nu este specificată, se folosește o valoare implicită de 0.5.  
     ```python
     connectivity = assessment.get("connectivity", 0.5)
     attributes = [
         assessment.get("awareness", 0),
         assessment.get("conscientiousness", 0),
         assessment.get("stress", 0),
         assessment.get("neuroticism", 0),
         assessment.get("risk_tolerance", 0),
         connectivity
     ]
     ```
  2. **Calculul Riscului Psihometric:**  
     Se apelează funcția `predict_attack_risk` (din modulul `predict_attack_risk.py`) folosind vectorul de atribute și tipul de atac dorit. Acest pas reflectă evaluarea internă a riscului bazat pe trăsăturile individuale.
     ```python
     psychometric_risk = predict_attack_risk(attributes, attack_type)
     ```
  3. **Calculul Riscului Entităților:**  
     Pentru fiecare entitate din lista `related_entities`, se extrag valorile `vulnerability_score` și `connectivity` (cu o valoare implicită de 0.5, dacă lipsește). Se presupune că "conectivitatea" reprezintă o pondere a influenței entității asupra persoanei. Se calculează un risc ponderat pentru fiecare entitate (produsul dintre vulnerabilitate și conectivitate) și se agregă aceste valori. Rezultatul este apoi normalizat (presupunându-se că vulnerabilitatea poate varia între 0 și 10).
     ```python
     for entity in related_entities:
         vulnerability = entity.get("vulnerability_score", 0)
         ent_connectivity = entity.get("connectivity", 0.5)
         weight_val = ent_connectivity
         weighted_risk = vulnerability * weight_val
         risk_sum += weighted_risk
         total_weight += weight_val
         entity_details.append({
             "entity_id": entity.get("id"),
             "name": entity.get("name"),
             "vulnerability": vulnerability,
             "connectivity": ent_connectivity,
             "weight": weight_val,
             "weighted_risk": weighted_risk
         })
     if total_weight > 0:
         entity_risk = min(risk_sum / total_weight / 10, 1)
     ```
  4. **Calculul Riscului Compozit:**  
     Se combină cele două componente folosind ponderi implicite (0.7 pentru riscul psihometric și 0.3 pentru riscul entităților). Această alegere reflectă ipoteza că trăsăturile individuale au un impact mai mare asupra riscului general, dar contribuția entităților nu este neglijabilă.
     ```python
     composite_risk = weights["psychometric"] * psychometric_risk + weights["entity"] * entity_risk
     composite_risk = min(max(composite_risk, 0), 1)
     ```

### 1.2. Justificări Teoretice și Literatura de Specialitate

- **Integrarea Factorilor Interni și Externi:**  
  Metodologia de calcul a riscului compozit se bazează pe principiul că factorii individuali (psihometric) și cei de mediu (vulnerabilități ale entităților) se combină pentru a produce un risc global. Literatura în domeniul evaluării riscului (Bishop, 2006; Jain, 2010) susține abordări de tipul „multi-factor”, unde fiecare componentă contribuie la scorul final.
  
- **Alegerea Ponderilor:**  
  Ponderile implicite (0.7 și 0.3) sunt selectate pe baza observațiilor empirice că comportamentul individual este adesea principalul predictor al riscului într-un context organizațional, deși mediul (rețelele și entitățile asociate) are, de asemenea, un impact semnificativ. Aceste valori pot fi optimizate ulterior prin tehnici de validare încrucișată și ajustări pe baza datelor reale.

- **Normalizarea Riscului Entităților:**  
  Presupunerea că vulnerabilitatea entităților se încadrează într-un interval de la 0 la 10 permite normalizarea acestora în intervalul [0,1]. Această abordare este comună în analiza de risc, unde se dorește comparabilitatea diverselor surse de risc.

---

## 2. Funcția `compute_all_person_risks`

### 2.1. Obiectiv și Flux de Procesare

- **Scop:**  
  Această funcție colectează datele necesare din diferite surse ale HRDataProxy (persoane, evaluări psihometrice, entități și relații) și calculează scorul compozit de risc pentru fiecare persoană.

- **Pașii de Procesare:**
  1. **Colectarea Datelor:**  
     Se apelează metodele `get_persons()`, `get_psychometric_assessments()`, `get_entities()` și `get_relationships()` pentru a obține datele brute.
  2. **Construirea Lookup-ului pentru Evaluări:**  
     Se creează un dicționar în care cheia este `person_id` și valoarea este evaluarea asociată, pentru acces rapid.
     ```python
     assessment_dict = { a["person_id"]: a for a in assessments }
     ```
  3. **Maparea Relațiilor Persoană-Entitate:**  
     Pe baza relațiilor obținute, se asociază fiecărei persoane lista de entități relevante, ceea ce permite calculul riscului entităților.
     ```python
     if rel["parent_type"] == "person" and rel["child_type"] == "entity":
         pid = rel["parent_id"]
         entity = next((e for e in entities if e["id"] == rel["child_id"]), None)
         if entity:
             person_entities.setdefault(pid, []).append(entity)
     ```
  4. **Calculul Riscului pentru Fiecare Persoană:**  
     Pentru fiecare persoană se extrage evaluarea corespunzătoare și se apelează funcția `compute_composite_risk_for_person` pentru a obține o detaliere completă a riscului. Rezultatele sunt apoi adunate într-o listă de dicționare.
  
### 2.2. Justificări și Beneficii

- **Abordare Integrată:**  
  Combinarea datelor din surse multiple (persoane, evaluări, entități și relații) oferă o perspectivă holistică asupra riscului, în conformitate cu teoriile moderne din managementul riscului și psihologia organizațională.
- **Flexibilitate și Scalabilitate:**  
  Funcția este concepută să funcționeze cu orice implementare a HRDataProxy, permițând extinderea ulterioară a datelor analizate (ex. adăugarea de noi atribute sau relații).
- **Validitate Internă:**  
  Maparea evaluărilor și a relațiilor asigură că fiecare persoană este evaluată în contextul său specific, reflectând o abordare individualizată a riscului.

---

## 3. Interdependențe cu Alte Module

### 3.1. Integrarea cu `predict_attack_risk.py`

Funcția `predict_attack_risk` este utilizată pentru a obține riscul psihometric al unei persoane. Această funcționalitate este crucială, deoarece:
- **Modelele Preantrenate:** Se folosește un model AI preantrenat pentru a evalua caracteristicile individuale.
- **Probabilități de Risc:** Metoda `predict_proba` oferă o distribuție a probabilităților pe clase, permițând alegerea unei valori corespunzătoare tipului de atac analizat.

### 3.2. Integrarea cu HRDataProxy

Datele furnizate de HRDataProxy (persoane, entități, evaluări, relații) sunt esențiale pentru calculul riscului. Modulul de risk analysis se bazează pe aceste date pentru a efectua o evaluare precisă, iar orice îmbunătățire a proxy-ului (de ex. includerea unor atribute suplimentare) va influența direct acuratețea scorurilor de risc.

---

## 4. Argumente și Parametri Importanți

- **weights:**  
  Parametrul `weights` (implicit `{"psychometric": 0.7, "entity": 0.3}`) stabilește importanța relativă a celor două componente de risc. Această alegere poate fi ajustată în funcție de datele empirice și de feedback-ul obținut din aplicația reală.
  
- **connectivity:**  
  Valoarea de conectivitate este esențială pentru evaluarea riscului entităților. Folosirea unei valori implicite (0.5) asigură continuitatea evaluării chiar și în lipsa datelor explicite.
  
- **Normalizarea Riscului:**  
  Normalizarea riscului entităților se face prin împărțirea scorului obținut la un factor (10), presupunând că vulnerabilitatea entităților variază între 0 și 10. Această normalizare permite combinarea directă a riscului psihometric (în intervalul [0,1]) cu riscul entităților.

---

## 5. Posibile Îmbunătățiri

- **Ajustarea Ponderilor:**  
  Se poate implementa o procedură de optimizare (ex. grid search) pentru a determina ponderile optime între riscul psihometric și cel al entităților, pe baza unui set de date real.
  
- **Modele de Agregare Non-liniare:**  
  În locul sumei ponderate liniare, se pot explora metode non-liniare (de exemplu, rețele neuronale sau modele bazate pe funcții de activare sigmoidale) pentru a capta relații complexe între componentele de risc.
  
- **Integrarea Altora Factori:**  
  Pe lângă cele cinci atribute principale, se pot include și alte variabile relevante (ex. istoricul incidentelor, nivelul de instruire în securitate) pentru a obține o evaluare mai completă a riscului.
  
- **Validare și Recalibrare:**  
  Utilizarea unor metode de validare încrucișată și recalibrare periodică a modelului pe date noi poate îmbunătăți robustețea și acuratețea evaluărilor.

---

## 6. Concluzii

Modulul `risk_analysis.py` este o componentă centrală în evaluarea riscului în cadrul sistemului de management al riscului în cybersecurity. Prin combinarea evaluării psihometrice cu analiza vulnerabilităților entităților, se obține un scor compozit care reflectă complexitatea factorilor ce influențează riscul unui atac. Această abordare integrată, bazată pe metode validate în literatura de specialitate, oferă o bază solidă pentru intervenții și strategii de securitate personalizate.

---

## 7. Referințe

1. **Bishop, C. M. (2006).** *Pattern Recognition and Machine Learning.* Springer.  
   - O referință fundamentală în învățarea automată, explicând conceptele de modelare și normalizare utilizate în acest modul.
2. **Jain, A. K. (2010).** *Data Clustering: 50 Years Beyond K-Means.* Pattern Recognition Letters.  
   - Deși se referă la clustering, principiile de agregare a datelor și evaluare a riscului sunt similare.
3. Studii în psihologia organizațională și managementul riscului care evidențiază importanța evaluării multiple a factorilor de risc în mediile de securitate.
4. Documentația oficială a bibliotecilor scikit-learn și NumPy pentru tehnicile de normalizare și modelare.

---

Această documentație academică detaliată oferă o perspectivă completă asupra modului de funcționare, justificare și potențiale îmbunătățiri pentru modulul de analiză a riscului (risk_analysis.py). Modulul se integrează în fluxul global al aplicației, influențând rezultatele ulterioare în simularea atacurilor și vizualizarea riscurilor într-un dashboard dedicat.


# PART 3

# Documentație Academică – Modulul de Construire a Grafului de Risc și Simularea Atacurilor

Acest modul, implementat în fișierul `build_risk_graph.py`, joacă un rol esențial în analiza și simularea propagării unui atac cibernetic. Modulul se bazează pe biblioteca **NetworkX** pentru modelarea relațiilor sub formă de graf și pe datele obținute din sistemul HR (prin `HRDataProxy`) și din evaluările psihometrice (prin funcția `compute_all_person_risks` din `risk_analysis.py`). Documentația de mai jos detaliază pașii de implementare, justificările tehnice și academice, precum și posibilele îmbunătățiri.

---

## 1. Introducere și Context

În cadrul unei organizații, evaluarea riscului cibernetic nu se bazează doar pe factorii individuali (psihometrie), ci și pe relațiile dintre persoane și entități (de exemplu, servere, stații de lucru). Modelarea acestor relații sub forma unui graf permite identificarea nodurilor critice (persoane sau entități) care pot fi vectori de propagare a atacurilor. 

**NetworkX** este o bibliotecă Python dedicată manipulării, analizării și vizualizării grafurilor. Aceasta este aleasă datorită:
- **Flexibilității:** Permite reprezentarea diverselor tipuri de grafuri (orientate, neorientate, ponderate etc.).
- **Funcționalității Extinse:** Oferă o gamă largă de algoritmi pentru analiză (de exemplu, parcurgerea grafurilor, calculul centralității, detectarea comunităților).
- **Literatură de Specialitate:** Metodele de analiză a rețelelor sunt bine documentate în literatura științifică și au fost aplicate cu succes în studiul rețelelor sociale și al sistemelor complexe (Wasserman & Faust, 1994).

---

## 2. Construirea Grafului de Risc

### 2.1. Funcția `build_risk_graph`

#### 2.1.1. Scop și Flux
- **Obiectiv:**  
  Funcția `build_risk_graph` creează un graf orientat (DiGraph) în care:
  - **Nodurile** reprezintă persoane și entități.
  - **Muchiile** reprezintă relațiile dintre aceste noduri, fiecare muchie fiind ponderată în funcție de "relationship_weight".

- **Fluxul de execuție:**
  1. **Calculul Evaluărilor:**  
     Se obțin evaluările compozite ale riscului pentru fiecare persoană prin apelul funcției `compute_all_person_risks`. Rezultatele sunt stocate într-un lookup (`risk_lookup`) unde cheia este ID-ul persoanei (convertit la string) și valoarea este scorul compozit de risc.
     
  2. **Adăugarea Nodurilor pentru Persoane:**  
     Pentru fiecare evaluare, se adaugă un nod în graf cu următoarele atribute:
     - **`id`:** ID-ul persoanei (ca string)  
     - **`risk`:** Scorul compozit de risc  
     - **`full_name`:** Numele complet  
     - **`details`:** Toate detaliile evaluate (pentru uz ulterior în analize)  
     - **`type`:** Etichetă "person" pentru diferențiere.
     
  3. **Adăugarea Nodurilor pentru Entități:**  
     Similar, pentru fiecare entitate, se adaugă un nod în graf. ID-urile entităților sunt prefixate cu `"entity_"` pentru a evita coliziunile cu ID-urile persoanelor. Atributele includ:
     - **`risk`:** Scorul de risc al entității (din câmpul `risk_score`)
     - **`full_name`:** Numele entității  
     - **`details`:** Informații suplimentare despre entitate  
     - **`type`:** Etichetă "entity".
     
  4. **Procesarea Relațiilor:**  
     Se obțin relațiile prin metoda `get_relationships()` din proxy-ul HR. Pentru fiecare relație, se determină:
     - **Source și Target:**  
       În funcție de tipurile părintelui și copilului (person sau entity), se convertesc ID-urile la string (prefixând entitățile cu `"entity_"`).
     - **Ponderea Muchiei:**  
       Se extrage valoarea `relationship_weight` și se convertește la float.
     - **Adăugarea Muchiei în Graf:**  
       Muchia este adăugată între source și target cu atributul `weight`.

#### 2.1.2. Justificări Teoretice
- **Convertirea ID-urilor la String:**  
  Această conversie previne problemele legate de tipurile neschimbabile (ex. seturi) și asigură consistența identificatorilor în graf, ceea ce este esențial pentru operații de căutare și indexare în NetworkX.
  
- **Modelarea Relațiilor ca Graf:**  
  Graful permite o analiză vizuală și algoritmică a propagării riscului. Teoria grafurilor a fost utilizată pe scară largă pentru a studia rețele sociale și a evidenția nodurile critice (Barabási, 2002).

---

## 3. Simularea Atacului

### 3.1. Funcția `simulate_attack`

#### 3.1.1. Scop și Flux
- **Obiectiv:**  
  Funcția `simulate_attack` simulează propagarea unui atac pornind de la un nod inițial. Se folosește o parcurgere în lățime (BFS) pentru a determina care noduri sunt compromise, în funcție de un prag de risc.

- **Pași de Procesare:**
  1. **Inițializare:**  
     - Nodul inițial este convertit la string și adăugat într-un set de noduri compromise.
     - Se initializează o coadă pentru parcurgerea grafului.
  
  2. **Parcurgerea Grafului (BFS):**  
     Pentru fiecare nod curent, se examinează vecinii:
     - Dacă riscul unui vecin (extras din `risk_lookup`) este peste pragul definit (`threshold`) și nodul nu este deja compromis, acesta este adăugat la setul de noduri compromise.
     - Informațiile despre propagare (de la ce nod la ce nod, cu ce pondere și riscul țintă) sunt înregistrate într-un jurnal (`simulation_log`).
     
  3. **Rezultatul:**  
     Funcția returnează setul de noduri compromise și jurnalul de simulare.

#### 3.1.2. Justificări Teoretice
- **Algoritmul BFS:**  
  Parcurgerea în lățime este o metodă clasică pentru explorarea grafurilor și este adecvată pentru simularea propagării, deoarece reflectă modul în care un atac se poate răspândi de la un nod către toți vecinii săi. Literatura de specialitate din teoria rețelelor (Newman, 2010) susține utilizarea BFS pentru analiza propagării în rețele.
  
- **Jurnalul de Simulare:**  
  Înregistrarea fiecărui pas de propagare permite o analiză ulterioară a traiectoriei atacului, identificând nodurile critice și calea de propagare, informații esențiale pentru strategiile de intervenție.

- **Utilizarea Pragului (Threshold):**  
  Stabilirea unui prag pentru risc este crucială pentru a decide dacă un nod este vulnerabil la un atac. Această metodă permite ajustarea sensibilității modelului de propagare și este susținută de lucrări în managementul riscului.

---

## 4. Interdependențe și Impactul Parametrilor

### 4.1. Biblioteci Folosite
- **NetworkX:**  
  Permite modelarea și analiza rețelelor complexe. Alegerea acestei biblioteci este motivată de flexibilitatea și bogăția funcționalităților oferite (Barabási, 2002; Newman, 2010).
- **ProxyHR și Risk Analysis:**  
  Aceste module furnizează datele necesare (persoane, entități, evaluări, relații) și calculele de risc, care stau la baza construirii grafului și simulării atacului.

### 4.2. Parametri Importanți
- **attack_type:**  
  Determină modul de evaluare a riscului (ex. phishing, social engineering). Aceasta influențează evaluările individuale și, implicit, scorurile de risc.
- **Threshold:**  
  Pragul de risc utilizat în simulare definește sensibilitatea propagării atacului. Un prag mai mic poate duce la o propagare extinsă, în timp ce un prag mai mare restrânge simularea la nodurile cele mai vulnerabile.
- **relationship_weight:**  
  Ponderea atribuită relațiilor influențează modul în care riscul se propagă de la un nod la altul. Valorile mai mari ale acestei ponderi cresc probabilitatea ca un nod să fie compromis.

---

## 5. Concluzii

Modulul de construire a grafului de risc și de simulare a atacului oferă o metodă integrată pentru evaluarea propagării riscului în cadrul organizațiilor. Prin utilizarea NetworkX și a datelor furnizate de HRDataProxy și risk_analysis, se obține o reprezentare structurală a relațiilor și se poate simula propagarea unui atac pe baza scorurilor de risc individuale. Această abordare permite:
- **Identificarea Nodurilor Critice:** Determinarea nodurilor cu risc ridicat, care pot fi vectori de propagare a atacurilor.
- **Analiza Traiectoriilor de Propagare:** Jurnalul de simulare oferă informații detaliate pentru analiza post-atac și pentru optimizarea măsurilor de intervenție.
- **Flexibilitate și Scalabilitate:** Parametrii modulului (attack_type, threshold, relationship_weight) pot fi ajustați pentru a adapta simularea la diverse scenarii, conform recomandărilor din literatura de specialitate.

---

## 6. Referințe

1. **Barabási, A.-L. (2002).** *Linked: The New Science of Networks.* Perseus Publishing.  
   - Prezintă fundamentele teoriei rețelelor și importanța structurii rețelelor în diverse domenii, inclusiv cybersecurity.
2. **Newman, M. E. J. (2010).** *Networks: An Introduction.* Oxford University Press.  
   - Oferă o introducere completă în analiza rețelelor, incluzând algoritmi de parcurgere și metode de propagare a informațiilor.
3. Diverse lucrări din literatura de securitate cibernetică care subliniază importanța evaluării riscului la nivel de rețea și analiza relațiilor interpersonale.

---

Această documentație academică detaliată prezintă modul în care funcționează modulele de construire a grafului și simulare a atacului, argumentând de ce s-au ales tehnologiile și metodele utilizate, și oferind o bază solidă pentru posibile îmbunătățiri ulterioare.


# PART 4 

# Documentație Academică – Modulul de Detectare a Anomaliilor

## 1. Introducere

Acest modul implementează o metodă de detectare a anomaliilor în seturi de scoruri de risc compozit utilizând algoritmul **IsolationForest** din scikit-learn. Detectarea anomaliilor este crucială în analiza riscului, deoarece identifică valorile atipice care pot indica erori de măsurare sau comportamente neobișnuite ce necesită atenție specială în contextul securității cibernetice.

## 2. Metodologia

- **Preprocesarea Datelor:**  
  Funcția `detect_anomalies` primește o listă de scoruri de risc și le transformă într-un array NumPy, redimensionat la o coloană, astfel încât să fie compatibil cu cerințele algoritmului.

- **IsolationForest:**  
  Algoritmul este ales datorită eficienței sale în detectarea anomaliilor în seturi de date multivariate, fără a presupune o distribuție specifică a datelor. Parametrul `contamination` (implicit 0.1) indică fracția estimată de anomalii în setul de date, iar `random_state=42` asigură reproducibilitatea rezultatelor.
  
- **Procesul de Predicție:**  
  Metoda `fit_predict` a algoritmului returnează etichete pentru fiecare eșantion, unde valoarea `-1` indică o anomalie. Funcția extrage indexul fiecărui eșantion etichetat ca anomalie și le returnează sub forma unei liste.

## 3. Beneficii și Considerații

- **Robustețe și Eficiență:**  
  IsolationForest este recunoscut pentru capacitatea sa de a izola anomaliile printr-un proces bazat pe construcția de arbori de decizie randomizați, fiind adecvat pentru seturi de date cu dimensiuni mari.

- **Aplicații în Securitate:**  
  Identificarea valorilor atipice în scorurile de risc poate contribui la detectarea incidențelor de securitate sau a erorilor în sistem, îmbunătățind astfel calitatea evaluărilor și a deciziilor de intervenție.

## 4. Concluzii

Modulul de detectare a anomaliilor utilizează IsolationForest pentru a identifica automat elementele atipice din scorurile de risc compozit, contribuind astfel la o analiză mai riguroasă și la îmbunătățirea managementului riscului în contextul cybersecurity.

## 5. Referințe

1. Liu, F. T., Ting, K. M., & Zhou, Z. H. (2008). Isolation Forest. In *2008 Eighth IEEE International Conference on Data Mining*.
2. Bishop, C. M. (2006). *Pattern Recognition and Machine Learning.* Springer.

# FINAL 

# Documentație Academică – Modulul RiskManager și API-ul asociat

Acest document prezintă o analiză detaliată și academică a modulului principal de management al riscului, care integrează funcționalitățile de extragere a datelor HR, calcularea scorurilor de risc, simularea propagării atacurilor și predicția riscului, expuse printr-un API REST. Documentația explică modul de funcționare al clasei `RiskManager`, interacțiunea cu bibliotecile și modulele externe, justificările metodologice și posibilele direcții de îmbunătățire.

---

## 1. Introducere

În contextul securității cibernetice, evaluarea riscului nu poate fi bazată exclusiv pe factori individuali, ci trebuie să integreze și relațiile dintre utilizatori și entități (ex.: infrastructură IT). Modulul `RiskManager` servește ca nucleu pentru această abordare integrată, combinând:
- Datele provenite din sistemul HR (obținute prin intermediul clasei `HRDataProxy`),
- Evaluările psihometrice și calculele de risc (din modulul `risk_analysis`),
- Simularea propagării atacurilor în rețea (prin funcțiile din `simulate_attack`),
- Predicția riscului pentru atacuri specifice (din modulul `predict_attack_risk`),
- Detectarea anomaliilor (prin `anomaly_detection`).

Această arhitectură modulară permite o evaluare holistică a riscului și oferă suport decizional în managementul securității cibernetice.

---

## 2. Arhitectura și Bibliotecile Utilizate

### 2.1. Biblioteci Externe și Internaționale
- **os:** Pentru gestionarea variabilelor de mediu și a parametrilor de configurare.
- **Flask & Flask-CORS:** Pentru expunerea API-ului REST, permițând comunicarea între backend și frontend, și pentru a asigura accesul cross-origin.
- **NetworkX:** Pentru modelarea relațiilor sub forma unui graf orientat, esențial în simularea propagării atacurilor.
- **Module interne:**  
  - `proxyHR`: Accesul la datele HR (persoane, entități, evaluări, relații).  
  - `risk_analysis`: Calcularea scorurilor de risc compozit și detaliat pentru fiecare persoană.  
  - `simulate_attack`: Construirea grafului de risc și simularea propagării unui atac.  
  - `predict.predictRisk`: Predicția riscului pentru un anumit tip de atac, pe baza evaluărilor psihometrice.  
  - `anomaly_detection`: Detectarea anomaliilor în scorurile de risc.

### 2.2. Fluxul Datelor și Interdependențele
- **Colectarea Datelor HR:**  
  Clasa `HRDataProxy` se ocupă de extragerea datelor din backend-ul HR (persoane, entități, evaluări și relații). Aceste date sunt fundamentale pentru calculul riscului și pentru construirea grafului.

- **Calculul Riscului:**  
  Funcțiile din `risk_analysis` preiau datele HR și folosesc metoda `predict_attack_risk` pentru a determina scorul psihometric, integrând apoi influența entităților asociate pentru a produce un scor compozit.  
  Parametrii (ex. ponderile implicite `{"psychometric": 0.7, "entity": 0.3}`) pot fi ajustați pe baza datelor empirice și a feedback-ului din mediul real.

- **Construirea Grafului:**  
  Funcția `build_risk_graph` din modulul de simulare creează un graf folosind NetworkX. Nodurile reprezintă persoane și entități, iar muchiile reflectă relațiile dintre ele, ponderate cu valorile din `relationship_weight`.  
  Acest graf permite simularea propagării unui atac și identificarea nodurilor critice.

- **Simularea Atacului:**  
  Funcția `simulate_attack` efectuează o parcurgere (BFS) a grafului pentru a determina care noduri sunt compromise, bazându-se pe un prag de risc. Jurnalul de simulare documentează fiecare pas de propagare.

- **Expunerea prin API:**  
  Clasa `RiskManager` este expusă prin intermediul unui API Flask, care include endpoint-uri pentru:
  - Obținerea evaluărilor de risc pentru persoane.
  - Simularea unui atac.
  - Predicția riscului pentru un set de atribute.
  - Construirea și expunerea grafului de risc.
  - Obținerea detaliilor pentru o persoană specifică.
  - Accesul la relații.

---

## 3. Analiza Detaliată a Clasei `RiskManager`

### 3.1. Constructorul (`__init__`)
- **Ce face:**  
  Inițializează instanța folosind URL-ul API-ului HR și creează o instanță a clasei `HRDataProxy`.
- **Justificare:**  
  Această abordare centralizează accesul la datele HR și permite reutilizarea ulterioară în metodele clasei.

### 3.2. Metoda `get_all_person_risks`
- **Funcționalitate:**  
  Apelează funcția `compute_all_person_risks` din modulul `risk_analysis` pentru a obține evaluările complete ale riscului pentru toate persoanele.
- **Beneficii:**  
  Asigură o evaluare integrată, bazată pe toate datele relevante, facilitând analiza ulterioară a riscului la nivel organizațional.

### 3.3. Metoda `get_person_details`
- **Funcționalitate:**  
  Parcurge lista evaluărilor obținute pentru a returna detaliile de risc pentru o persoană specifică, asigurând comparații consistente prin convertirea ID-urilor la string.
- **Beneficii:**  
  Permite accesul rapid la detalii individuale, util pentru intervenții personalizate în managementul riscului.

### 3.4. Metoda `simulate_attack`
- **Funcționalitate:**  
  Construiește graful de risc folosind `build_risk_graph`, apoi simulează propagarea unui atac pornind de la un nod inițial, utilizând un prag de risc.
- **Beneficii:**  
  Permite identificarea nodurilor critice și analiza traiectoriei atacului, informații esențiale pentru strategiile de prevenire și intervenție.
- **Parametri Importanți:**  
  - `initial_node`: Nodul de pornire (convertit la string pentru consistență).
  - `threshold`: Pragul de risc peste care un nod este considerat compromis.

### 3.5. Metoda `predict_risk`
- **Funcționalitate:**  
  Invocă funcția `predict_attack_risk` pentru a calcula probabilitatea ca o persoană să fie expusă unui anumit tip de atac, pe baza unui vector de atribute.
- **Beneficii:**  
  Oferă o estimare rapidă și bazată pe modelul preantrenat, facilitând luarea deciziilor de intervenție.

### 3.6. Metoda `get_graph`
- **Funcționalitate:**  
  Construieste un graf reprezentativ pentru întreaga rețea organizațională. Nodurile sunt adăugate pentru persoane și entități, iar relațiile sunt procesate pentru a crea muchii ponderate.
- **Beneficii:**  
  Oferă o vizualizare structurată a rețelei, utilă pentru analiza propagării riscului și identificarea nodurilor critice.

### 3.7. Metoda `get_anomaly_alerts`
- **Funcționalitate:**  
  Utilizează funcția `detect_anomalies` pentru a identifica anomalii în scorurile compozite de risc.
- **Beneficii:**  
  Permite detectarea valorilor atipice, care pot semnala probleme de calitate a datelor sau comportamente neobișnuite, contribuind la o analiză mai fină a riscului.

---

## 4. Expunerea prin API

Modulul definește un set de endpoint-uri REST folosind Flask, fiecare având rolul de a expune funcționalitățile implementate în clasa `RiskManager`:

- **`/api/person_risks` (GET):**  
  Returnează evaluările de risc pentru toate persoanele, bazate pe tipul de atac specificat.

- **`/api/simulate_attack` (POST):**  
  Primește ca input nodul inițial, tipul de atac și pragul de risc, apoi returnează lista nodurilor compromise și jurnalul de propagare a atacului.

- **`/api/predict_risk` (POST):**  
  Primește un vector de atribute și tipul de atac, apoi returnează probabilitatea ca persoana să fie expusă acelui atac.

- **`/api/graph` (GET):**  
  Returnează datele grafului (noduri și muchii) pentru vizualizarea rețelei organizaționale.

- **`/api/person_details/<int:person_id>` (GET):**  
  Returnează detaliile de risc pentru o persoană specifică, util pentru analiza individuală.

- **`/api/relationships` (GET):**  
  Expune relațiile din sistemul HR, facilitând o analiză detaliată a conexiunilor dintre noduri.

Aceste endpoint-uri asigură interoperabilitatea între diferitele componente ale sistemului și permit integrarea cu dashboard-ul de vizualizare sau cu alte aplicații externe.

---

## 5. Concluzii

Modulul prezentat, prin intermediul clasei `RiskManager` și a API-ului asociat, oferă o soluție integrată pentru evaluarea și monitorizarea riscului cibernetic. Prin combinarea datelor HR, a evaluărilor psihometrice și a analizelor de rețea, sistemul permite:
- Evaluarea holistică a riscului la nivel de persoană și la nivel de rețea.
- Simularea propagării unui atac, evidențiind nodurile critice.
- Detectarea anomaliilor în scorurile de risc pentru o intervenție rapidă.

Această abordare modulară și scalabilă se bazează pe biblioteci și tehnici validate în literatura de specialitate (Bishop, 2006; Newman, 2010; Barabási, 2002) și poate fi extinsă prin integrarea unor modele non-liniare, optimizarea parametrilor și implementarea unor strategii avansate de vizualizare.

---

## 6. Referințe

1. **Bishop, C. M. (2006).** *Pattern Recognition and Machine Learning.* Springer.
2. **Newman, M. E. J. (2010).** *Networks: An Introduction.* Oxford University Press.
3. **Barabási, A.-L. (2002).** *Linked: The New Science of Networks.* Perseus Publishing.
4. Studii din domeniul managementului riscului și al securității cibernetice care subliniază importanța unei abordări integrate pentru evaluarea riscului.

