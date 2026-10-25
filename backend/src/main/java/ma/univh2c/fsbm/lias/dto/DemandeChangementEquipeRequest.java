package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeChangementEquipeRequest {

    /**
     * ID de l'équipe cible (optionnel : null si le membre demande à quitter son équipe sans en rejoindre une autre)
     */
    private Long nouvelleEquipeId;

    @NotBlank(message = "Le motif ou la justification du changement d'équipe est obligatoire")
    private String motif;
}
