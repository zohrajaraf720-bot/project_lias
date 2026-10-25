package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutMembre;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembrePublicDTO {
    private Long id;
    private String nom;
    private String prenom;
    private String photo;
    private Long equipeId;
    private String equipeNom;
    private StatutMembre statut;
}
