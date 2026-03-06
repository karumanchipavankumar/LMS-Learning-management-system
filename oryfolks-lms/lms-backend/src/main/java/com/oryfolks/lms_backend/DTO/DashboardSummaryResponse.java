package com.oryfolks.lms_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardSummaryResponse {
    private long publishedCount;
    private long assignedCount;
    private long pendingCount;
    private long totalMembersCount;
    private int averageCompletionRate;
    private List<RecentAssignmentDTO> recentAssignments;
}
