package ma.univh2c.fsbm.lias.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReunionRequest {
    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    @JsonAlias({"dateHeure", "date_heure"})
    @NotNull(message = "La date de la réunion est obligatoire")
    private LocalDateTime dateReunion;

    private String lieu;

    private String ordreDuJour;

    private List<Long> participantsIds;

    public void setDateHeure(LocalDateTime dateHeure) {
        if (this.dateReunion == null) {
            this.dateReunion = dateHeure;
        }
    }

    public LocalDateTime getDateHeure() {
        return this.dateReunion;
    }
}
