package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeJeton;
import java.time.LocalDateTime;

@Entity
@Table(name = "jetons_securite")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JetonSecurite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String hashJeton;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeJeton type;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    @Column(nullable = false)
    private LocalDateTime dateExpiration;

    @Builder.Default
    private Boolean revoque = false;

    @Builder.Default
    private Boolean utilise = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membre_id", nullable = false)
    private Membre membre;

    public boolean estValide() {
        return !revoque && !utilise && dateExpiration.isAfter(LocalDateTime.now());
    }
}
