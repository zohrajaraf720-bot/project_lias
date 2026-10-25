package ma.univh2c.fsbm.lias.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutReunion;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReunionDTO {
    private Long id;
    private String titre;
    private LocalDateTime dateReunion;
    private String lieu;
    private String ordreDuJour;
    private StatutReunion statut;
    private MembreResumeDTO organisateur;
    private List<MembreResumeDTO> participants;
    private Long pvDocumentId;
    private String pvDocumentNom;

    @JsonProperty("dateHeure")
    public LocalDateTime getDateHeure() {
        return dateReunion;
    }

    @JsonProperty("dateReunion")
    public LocalDateTime getDateReunion() {
        return dateReunion;
    }
}
