package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutMembre;
import java.time.LocalDate;

@Entity
@Table(name = "historique_statuts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriqueStatut {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutMembre ancienStatut;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutMembre nouveauStatut;

    @Column(nullable = false)
    private LocalDate dateChangement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membre_id", nullable = false)
    private Membre membre;
}
