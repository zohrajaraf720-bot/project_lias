package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutDemandeMateriel;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeMaterielDTO {
    private Long id;
    private String descriptionBesoin;
    private Integer quantite;
    private LocalDateTime dateSoumission;
    private LocalDateTime dateTraitement;
    private StatutDemandeMateriel statut;
    private String commentaireDirection;
    private MembreResumeDTO demandeur;
    private String materielAttribue;
}
