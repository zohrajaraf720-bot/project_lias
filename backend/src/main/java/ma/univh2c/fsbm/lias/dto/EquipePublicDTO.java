package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipePublicDTO {
    private Long id;
    private String nom;
    private String acronyme;
    private String description;
    private List<String> thematiques;
    private List<String> axesRecherche;
    private String logo;
    private MembreResumeDTO chefActuel;
    private MembreResumeDTO chefEquipe;
    private List<MembreResumeDTO> membres;
    private List<PublicationDTO> publications;
}
