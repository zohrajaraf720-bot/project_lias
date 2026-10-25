package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeDocument;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadRequest {
    @NotNull(message = "Le fichier est obligatoire")
    private MultipartFile fichier;

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    @NotNull(message = "Le type de document est obligatoire")
    private TypeDocument typeDocument;

    private Long evenementId;
    private Long conventionId;

    public void setType(TypeDocument type) {
        this.typeDocument = type;
    }

    public TypeDocument getType() {
        return this.typeDocument;
    }
}
