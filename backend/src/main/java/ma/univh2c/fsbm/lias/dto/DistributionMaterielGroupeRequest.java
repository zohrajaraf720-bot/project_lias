package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DistributionMaterielGroupeRequest {

    @NotNull(message = "Le matériel est obligatoire")
    private Long materielId;

    /**
     * Mode de distribution : "MEMBRES" ou "EQUIPE"
     */
    private String mode;

    /**
     * Liste des IDs des membres bénéficiaires (utilisé si mode == 'MEMBRES')
     */
    private List<Long> membreIds;

    /**
     * ID de l'équipe bénéficiaire (utilisé si mode == 'EQUIPE')
     */
    private Long equipeId;

    /**
     * Quantité attribuée à chaque membre (ex: 1 unité chacun, 2 unités chacun)
     */
    @NotNull(message = "La quantité par membre est obligatoire")
    @Min(value = 1, message = "La quantité par membre doit être d'au moins 1")
    private Integer quantiteParMembre;

    /**
     * Motif ou commentaire de la dotation (optionnel)
     */
    private String motif;
}
