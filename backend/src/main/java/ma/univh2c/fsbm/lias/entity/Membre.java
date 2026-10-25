package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.EtatCompte;
import ma.univh2c.fsbm.lias.enums.RoleSysteme;
import ma.univh2c.fsbm.lias.enums.StatutMembre;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "membres")
@SQLRestriction("archive = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Membre extends EntiteAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String photo;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String motDePasse;

    @Builder.Default
    private Boolean doitChangerMotDePasse = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleSysteme roleSysteme;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutMembre statut;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EtatCompte etatCompte;

    private String etablissementOrigine;

    private String laboratoireOrigine;

    @Column(columnDefinition = "TEXT")
    private String biographie;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "membre_centres_interet", joinColumns = @JoinColumn(name = "membre_id"))
    @Column(name = "interet")
    @Builder.Default
    private List<String> centresInteret = new ArrayList<>();

    private LocalDate dateNaissance;

    private LocalDate dateEmbauche;

    private LocalDate dateAffiliation;

    private LocalDate dateRetraite;

    private LocalDate dateDepart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id")
    private Equipe equipeActuelle;

    @OneToMany(mappedBy = "membre", cascade = CascadeType.ALL)
    @Builder.Default
    private List<PeriodeAffiliation> periodesAffiliation = new ArrayList<>();

    @OneToMany(mappedBy = "membre")
    @Builder.Default
    private List<Mandat> mandats = new ArrayList<>();

    @OneToMany(mappedBy = "membre")
    @Builder.Default
    private List<AffectationRole> affectationsRole = new ArrayList<>();

    @OneToMany(mappedBy = "membre", cascade = CascadeType.ALL)
    @Builder.Default
    private List<HistoriqueStatut> historiqueStatuts = new ArrayList<>();

    @OneToMany(mappedBy = "membre", cascade = CascadeType.ALL)
    @Builder.Default
    private List<HistoriqueProfil> historiqueProfils = new ArrayList<>();

    @OneToOne(mappedBy = "membreCree")
    private DemandeAdhesion demandeAdhesion;

    public void gelerCompte(LocalDate dateRetraite) {
        this.etatCompte = EtatCompte.GELE;
        this.dateRetraite = dateRetraite;
    }

    public void desactiverCompte(LocalDate dateDepart) {
        this.etatCompte = EtatCompte.DESACTIVE;
        this.dateDepart = dateDepart;
    }

    public void reactiverCompte() {
        this.etatCompte = EtatCompte.ACTIF;
        this.dateDepart = null;
    }
}
