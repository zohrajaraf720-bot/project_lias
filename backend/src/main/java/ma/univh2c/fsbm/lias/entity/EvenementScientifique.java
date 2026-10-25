package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutEvenement;
import ma.univh2c.fsbm.lias.enums.StatutValidationEvenement;
import ma.univh2c.fsbm.lias.enums.TypeEvenement;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "evenements_scientifiques")
@SQLRestriction("archive = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvenementScientifique extends EntiteAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeEvenement type;

    @Column(nullable = false)
    private LocalDateTime dateDebut;

    @Column(nullable = false)
    private LocalDateTime dateFin;

    private String edition;

    private String lieu;

    private String lienWebinaire;

    @Column(columnDefinition = "TEXT")
    private String programmeDetaille;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutEvenement statut = StatutEvenement.EN_PREPARATION;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutValidationEvenement statutValidation = StatutValidationEvenement.EN_ATTENTE_VALIDATION;

    private LocalDateTime dateValidation;

    private String commentaireValidation;

    @ManyToMany
    @JoinTable(
        name = "evenement_organisateurs",
        joinColumns = @JoinColumn(name = "evenement_id"),
        inverseJoinColumns = @JoinColumn(name = "membre_id")
    )
    @Builder.Default
    private Set<Membre> organisateurs = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "valideur_id")
    private Membre valideur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "convention_id")
    private Convention convention;

    @OneToMany(mappedBy = "evenement")
    @Builder.Default
    private List<ParticipationEvenement> participations = new ArrayList<>();

    @OneToMany(mappedBy = "evenement")
    @Builder.Default
    private List<Document> documents = new ArrayList<>();

    public void ajouterOrganisateur(Membre membre) {
        this.organisateurs.add(membre);
    }

    public void valider(Membre directeur) {
        this.statutValidation = StatutValidationEvenement.VALIDE;
        this.valideur = directeur;
        this.dateValidation = LocalDateTime.now();
    }

    public void rejeter(Membre directeur, String commentaire) {
        this.statutValidation = StatutValidationEvenement.REJETE;
        this.valideur = directeur;
        this.commentaireValidation = commentaire;
        this.dateValidation = LocalDateTime.now();
    }

    public void archiverEdition() {
        this.statut = StatutEvenement.ARCHIVE;
    }

    public boolean estArchive() {
        return this.statut == StatutEvenement.ARCHIVE;
    }
}
