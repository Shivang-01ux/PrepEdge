package com.prepedge.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class BulkUploadResponse {
    private int uploaded;
    private int failed;
    private List<String> errors;
}
